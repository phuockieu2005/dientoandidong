const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3001;

// ✅ Kết nối MySQL
const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "123456",
    database: "login",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Không thể kết nối MySQL:", err.message);
        process.exit(1);
    }
    console.log("✅ Kết nối MySQL thành công!");
});

app.get('/', (req, res) => {
    res.send('Chào mừng bạn đến với WebSocket Server!');
});
// 🟢 Xử lý WebSocket
io.on("connection", (socket) => {
    console.log(`🟢 Người dùng kết nối: ${socket.id}`);

    socket.on("chat message", (data) => {
        console.log(`📩 Tin nhắn từ ${data.senderId} đến ${data.receiverId}: ${data.message}`);

        // ✅ Lưu tin nhắn vào MySQL
        db.query("INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)", 
            [data.senderId, data.receiverId, data.message], (err) => {
            if (err) {
                console.error("❌ Lỗi lưu tin nhắn:", err);
            } else {
                io.emit("newMessage", data);
            }
        });
    });

    socket.on("disconnect", () => {
        console.log(`🔴 Người dùng ${socket.id} đã ngắt kết nối`);
    });
});

// 🚀 Khởi động WebSocket Server
server.listen(PORT, () => {
    console.log(`✅ WebSocket Server đang chạy tại http://localhost:${PORT}`);
});
