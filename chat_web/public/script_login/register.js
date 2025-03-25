document.getElementById("submit").addEventListener("click", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username_create").value.trim();
    const email = document.getElementById("email_create").value.trim();
    const password = document.getElementById("password_create").value.trim();
    const confirmPassword = document.getElementById("password_create_again").value.trim();

    if (!username || !email || !password || !confirmPassword) {
        alert("Vui lòng điền đầy đủ thông tin đăng ký.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Địa chỉ email không hợp lệ.");
        return;
    }

    if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Mật khẩu nhập lại không khớp.");
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Đăng ký thành công! Chuyển hướng đến trang đăng nhập.");
            window.location.href = "/src/Login_register/login.html";
        } else {
            alert(result.message || "Đăng ký thất bại.");
        }
    } catch (error) {
        console.error("Lỗi khi đăng ký:", error);
        alert("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
    }
});