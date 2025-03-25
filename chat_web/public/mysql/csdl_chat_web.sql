create database login;
use login;
CREATE TABLE register (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng login
CREATE TABLE login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo trigger để liên kết hai bảng
DELIMITER $$

CREATE TRIGGER after_register_insert
AFTER INSERT ON register
FOR EACH ROW
BEGIN
    -- Chèn thông tin username vào bảng login
    INSERT INTO login (username,password, created_at)
    VALUES (NEW.username,new.password, NOW());
END $$

DELIMITER ;

DESCRIBE register;
INSERT INTO register (id, username, password, email) 
VALUES (1, 'admin', '123', 'admin@gmail.com');

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES register(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES register(id) ON DELETE CASCADE
);

SELECT * FROM messages;
select * from login

