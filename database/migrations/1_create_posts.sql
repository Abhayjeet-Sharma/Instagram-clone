CREATE TABLE posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    caption TEXT,

    image_data BYTEA NOT NULL,

    image_type VARCHAR(50) NOT NULL,

    image_size BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_image_type
        CHECK (image_type IN (
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
        )),

    CONSTRAINT valid_image_size
        CHECK (image_size > 0 AND image_size <= 5242880)
);

CREATE INDEX idx_posts_created_at
ON posts (created_at DESC);