CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_username
        CHECK (username ~ '^[A-Za-z0-9._]{3,30}$'),

    CONSTRAINT valid_email
        CHECK (email = TRIM(email) AND email <> ''),

    CONSTRAINT valid_password_hash
        CHECK (password_hash <> '')
);

-- Usernames must be unique, regardless of capitalization.
CREATE UNIQUE INDEX idx_users_username_unique
ON users (LOWER(username));

-- Emails must also be unique, regardless of capitalization.
CREATE UNIQUE INDEX idx_users_email_unique
ON users (LOWER(email));