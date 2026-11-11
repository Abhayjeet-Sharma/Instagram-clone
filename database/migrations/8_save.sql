CREATE TABLE saved_posts (
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_saved_posts PRIMARY KEY (user_id, post_id),

    CONSTRAINT fk_saved_posts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_posts_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE
);