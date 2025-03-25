require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ✅ Cấu hình CORS
app.use(cors({
    origin: "http://localhost:3001", // 🟢 Sửa đúng địa chỉ frontend
    methods: ["GET", "POST"],
    credentials: true
}));


// Middleware cần thiết để đọc JSON và dữ liệu form
app.use(express.json()); // 🟢 Đọc JSON từ request body
app.use(express.urlencoded({ extended: true })); // 🟢 Hỗ trợ dữ liệu form

// ✅ Kết nối MySQL


db.connect((err) => {
    if (err) {
        console.error("❌ Không thể kết nối MySQL:", err.message);
        process.exit(1);
    }
    console.log("✅ Kết nối MySQL thành công!");
});

// ✅ Lưu session vào MySQL
const sessionStore = new MySQLStore({}, db);

app.use(session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false, httpOnly: true, sameSite: "lax" }
}));


// Middleware
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"..", "public", "home.html"));
    app.use(express.static(path.join(__dirname,"..","public")));
});

// __drname là đường dẫn trước đó 


// ✅ API: Đăng nhập
app.post("/api/login", (req, res) => {
    console.log("🔍 Dữ liệu nhận được từ frontend:", req.body); // ✅ Debug

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Tên đăng nhập và mật khẩu không được để trống." });
    }

    db.query("SELECT * FROM register WHERE username = ?", [username], (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi hệ thống." });

        if (results.length === 0 || results[0].password !== password) {
            return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
        }

        req.session.user = { id: results[0].id, username: results[0].username };
        console.log("🔹 Session sau khi đăng nhập:", req.session);

        res.cookie("sessionID", req.sessionID, { httpOnly: true, secure: false });

        return res.json({ success: true, user: req.session.user, redirect: "/chat.html" });
    });
});



// ✅ API: Kiểm tra phiên đăng nhập
app.get("/api/check-session", (req, res) => {
    console.log("🔍 Kiểm tra session:", req.session);
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// ✅ API: Lấy danh sách người dùng
app.get("/api/users", (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Bạn chưa đăng nhập!" });

    db.query("SELECT id, username FROM register", (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi hệ thống." });
        res.json(results);
    });
});

// ✅ API: Đăng xuất
app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Không thể đăng xuất!" });
        res.json({ success: true, message: "Đăng xuất thành công!" });
    });
});

// ✅ API: Gửi tin nhắn
app.post("/api/messages", (req, res) => {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
        return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ." });
    }

    db.query(
        "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
        [senderId, receiverId, message],
        (err) => {
            if (err) {
                console.error("❌ Lỗi khi lưu tin nhắn:", err);
                return res.status(500).json({ success: false, message: "Lỗi hệ thống." });
            }

            io.emit("newMessage", { senderId, receiverId, message });
            res.status(201).json({ success: true, message: "Tin nhắn đã gửi!" });
        }
    );
});

// ✅ API: Nhận tin nhắn giữa 2 người
app.get("/api/messages", (req, res) => {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
        return res.status(400).json({ message: "Thiếu thông tin người gửi hoặc người nhận." });
    }

    const query = `
        SELECT 
            messages.id, 
            messages.sender_id, 
            messages.receiver_id, 
            messages.message, 
            messages.created_at AS timestamp, 
            sender.username AS sender_username
        FROM messages
        JOIN register AS sender ON messages.sender_id = sender.id
        WHERE 
            (messages.sender_id = ? AND messages.receiver_id = ?) 
            OR 
            (messages.sender_id = ? AND messages.receiver_id = ?)
        ORDER BY messages.created_at ASC
    `;

    db.query(query, [senderId, receiverId, receiverId, senderId], (err, results) => {
        if (err) {
            console.error("❌ Lỗi khi lấy tin nhắn:", err);
            return res.status(500).json({ message: "Lỗi hệ thống." });
        }
        res.json(results);
    });
});

// ✅ Cấu hình `socket.io`
io.on("connection", socket => {
    console.log("Người dùng đã kết nối");

    socket.on("sendMessage", data => {
        db.query("INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
            [data.senderId, data.receiverId, data.message], (err) => {
                if (!err) io.emit("newMessage");
            });
    });

    socket.on("disconnect", () => console.log("Người dùng đã thoát"));
});

// ✅ API: Đăng ký tài khoản
app.post("/api/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    db.query("SELECT * FROM register WHERE username = ? OR email = ?", [username, email], (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi hệ thống." });

        if (results.length > 0) {
            return res.status(400).json({ message: "Tên đăng nhập hoặc email đã tồn tại." });
        }

        db.query("INSERT INTO register (username, email, password) VALUES (?, ?, ?)", 
            [username, email, password], 
            (err) => {
                if (err) return res.status(500).json({ message: "Lỗi khi tạo tài khoản." });
                res.status(201).json({ message: "Đăng ký thành công!" });
            }
        );
    });
});

// ✅ Khởi động server, mở cho tất cả IP trong mạng
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
