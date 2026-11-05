ALTER TABLE comments
ADD COLUMN user_id BIGINT;

ALTER TABLE comments
ADD CONSTRAINT fk_comments_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

ALTER TABLE comments
ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX idx_comments_user_id
ON comments(user_id);