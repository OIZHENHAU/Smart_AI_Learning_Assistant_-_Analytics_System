CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
);

ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255) NOT NULL AFTER email;

ALTER TABLE users
ADD COLUMN phone_number VARCHAR(20) NULL AFTER password_hash;

INSERT INTO users (username, email, password_hash, phone_number) VALUES
    ("oizhenhau", "zhenhau8072@gmail.com", "Oi@916800", "+601115880259");