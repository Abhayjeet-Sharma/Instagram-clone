-- =====================================
-- COMMENTS TABLE
-- =====================================

CREATE TABLE comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    post_id BIGINT NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comments_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT valid_comment
        CHECK (LENGTH(TRIM(content)) > 0)
);


-- =====================================
-- LIKES TABLE
-- =====================================

CREATE TABLE likes (
    post_id BIGINT NOT NULL,

    client_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (post_id, client_id),

    CONSTRAINT fk_likes_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE
);


-- =====================================
-- INDEXES
-- =====================================

CREATE INDEX idx_comments_post_id
ON comments(post_id, created_at DESC);

CREATE INDEX idx_likes_post_id
ON likes(post_id);