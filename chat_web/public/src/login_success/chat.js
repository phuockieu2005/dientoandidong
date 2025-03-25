const socket = io("http://localhost:3001"); // 🟢 Đổi về localhost nếu test trên cùng 1 máy
let selectedUserId = null;
let currentUserId = null;
document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/check-session", { credentials: "include" }) // 🟢 Thêm credentials
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                currentUserId = data.user.id;
                document.getElementById("login-link").textContent = `👤 ${data.user.username}`;
                loadUsers();
            } else {
                window.location.href = "/src/login_register/login.html"; // Chuyển về trang đăng nhập nếu chưa login
            }
        });
});



function loadUsers() {
    fetch("/api/users", { credentials: "include" })
        .then(response => response.json())
        .then(users => {
            const userList = document.getElementById("users");
            userList.innerHTML = "";
            users.forEach(user => {
                if (user.id !== currentUserId) {
                    const li = document.createElement("li");
                    li.textContent = user.username;
                    li.onclick = () => selectUser(user.id, user.username);
                    userList.appendChild(li);
                }
            });
        });
}

function selectUser(userId, username) {
    selectedUserId = userId;
    document.getElementById("chatWith").textContent = `Chat với ${username}`;
    loadMessages();
}

function loadMessages() {
    fetch(`/api/messages?senderId=${currentUserId}&receiverId=${selectedUserId}`, { credentials: "include" })
        .then(response => response.json())
        .then(messages => {
            console.log("🔍 Dữ liệu tin nhắn:", messages); // Kiểm tra dữ liệu
            const messageBox = document.getElementById("messages");
            messageBox.innerHTML = "";
            messages.forEach(msg => {
                const div = document.createElement("div");

                if (msg.sender_id == currentUserId) {
                    div.classList.add("message", "sent");
                } else {
                    div.classList.add("message", "received");
                }

                const senderName = msg.sender_username || "Không xác định";

                // ✅ Kiểm tra timestamp và hiển thị đúng định dạng
                let timeSent = "Không có thời gian";
                if (msg.timestamp) {
                    timeSent = new Date(msg.timestamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
                }

                div.innerHTML = `<strong>${senderName}:</strong> ${msg.message} <span class="time">(${timeSent})</span>`;
                messageBox.appendChild(div);
            });

            messageBox.scrollTop = messageBox.scrollHeight;
        });
}



function sendMessage() {
    const message = document.getElementById("messageInput").value.trim();
    if (!message || !selectedUserId || !currentUserId) return;

    fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUserId, receiverId: selectedUserId, message }),
        credentials: "include"
    }).then(() => {
        document.getElementById("messageInput").value = "";
        loadMessages();
    });
}


// Bấm vào nút "Gửi" để gửi tin nhắn
document.getElementById("send").addEventListener("click", sendMessage);

// Nhấn Enter cũng gửi tin nhắn
document.getElementById("messageInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});



// Lắng nghe sự kiện từ Socket.io
socket.on("newMessage", () => loadMessages());
