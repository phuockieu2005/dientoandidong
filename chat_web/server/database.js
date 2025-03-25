require("dotenv").config();
const mysql = require("mysql2");

// Cấu hình MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "123456",
    database: process.env.DB_NAME || "login",
});

// Kết nối MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ Lỗi kết nối MySQL:", err.message);
        process.exit(1);
    }
    console.log("✅ Kết nối MySQL thành công!");
});

// 🟢 Xuất module đúng cách
module.exports = db;
