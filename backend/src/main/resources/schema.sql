-- =========================================================
-- SQL Schema Definition for ChitChat Application
-- Database Engine: PostgreSQL / MySQL / MariaDB / H2
-- =========================================================

-- 1. Create Schema / Database Namespace
CREATE DATABASE IF NOT EXISTS chitchat_db;
USE chitchat_db;

-- Disable foreign key checks for clean table re-creation
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Drop Tables if existing
DROP TABLE IF EXISTS chat_users;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- 3. Users Table
-- ---------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    pic VARCHAR(1000) DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 4. Chats Table
-- ---------------------------------------------------------
CREATE TABLE chats (
    id VARCHAR(36) PRIMARY KEY,
    chat_name VARCHAR(255),
    is_group_chat BOOLEAN DEFAULT FALSE,
    latest_message_id VARCHAR(36),
    group_admin_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chats_group_admin FOREIGN KEY (group_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- 5. Messages Table
-- ---------------------------------------------------------
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT,
    chat_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Add Circular Foreign Key for latest_message_id in chats
ALTER TABLE chats 
ADD CONSTRAINT fk_chats_latest_message 
FOREIGN KEY (latest_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ---------------------------------------------------------
-- 6. Chat Users Junction Table (Many-to-Many Relationship)
-- ---------------------------------------------------------
CREATE TABLE chat_users (
    chat_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (chat_id, user_id),
    CONSTRAINT fk_chat_users_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 7. Indexes for Query Performance Optimization
-- ---------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_chat_users_user_id ON chat_users(user_id);
