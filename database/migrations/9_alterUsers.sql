ALTER TABLE users
ADD COLUMN display_name VARCHAR(50),
ADD COLUMN bio VARCHAR(160),
ADD COLUMN profile_picture BYTEA,
ADD COLUMN profile_picture_type VARCHAR(50),
ADD COLUMN profile_picture_size BIGINT;

ALTER TABLE users
ADD CONSTRAINT valid_profile_picture_type
CHECK (
    profile_picture_type IS NULL
    OR profile_picture_type IN (
        'image/jpeg',
        'image/png',
        'image/webp'
    )
);

ALTER TABLE users
ADD CONSTRAINT valid_profile_picture_size
CHECK (
    profile_picture_size IS NULL
    OR (profile_picture_size > 0 AND profile_picture_size <= 5242880)
);

ALTER TABLE users
ADD CONSTRAINT valid_profile_picture_data
CHECK (
    (profile_picture IS NULL AND profile_picture_type IS NULL AND profile_picture_size IS NULL)
    OR
    (profile_picture IS NOT NULL AND profile_picture_type IS NOT NULL AND profile_picture_size IS NOT NULL)
);