ALTER TABLE posts
ADD COLUMN user_id BIGINT;

ALTER TABLE posts
ADD CONSTRAINT fk_posts_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

CREATE INDEX idx_posts_user_id
ON posts(user_id);