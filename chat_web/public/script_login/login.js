document.getElementById("submit").addEventListener("click", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username_login").value.trim();
    const password = document.getElementById("password_login").value.trim();

    if (!username || !password) {
        alert("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3001/api/login", { // 🟢 Sửa đúng đường dẫn server
            method: "POST",
            headers: {
                "Content-Type": "application/json" // 🟢 Đảm bảo gửi JSON
            },
            body: JSON.stringify({ username, password }),
            credentials: "include" // 🟢 Để giữ session
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Đăng nhập thành công!");
            window.location.href = "/src/login_success/index.html";
        } else {
            alert(result.message || "Sai tài khoản hoặc mật khẩu!");
        }
    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        alert("Đã xảy ra lỗi hệ thống!");
    }
});
