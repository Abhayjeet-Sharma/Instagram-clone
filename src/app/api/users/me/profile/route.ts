import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Read form data
    const formData = await request.formData();

    const displayNameValue = formData.get("displayName");
    const bioValue = formData.get("bio");
    const picture = formData.get("profilePicture");

    if (
      typeof displayNameValue !== "string" ||
      typeof bioValue !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid profile data" },
        { status: 400 }
      );
    }

    const displayName = displayNameValue.trim() || null;
    const bio = bioValue.trim() || null;

    // 3. Validate text fields
    if (displayName && displayName.length > 50) {
      return NextResponse.json(
        { error: "Display name cannot exceed 50 characters" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 160) {
      return NextResponse.json(
        { error: "Bio cannot exceed 160 characters" },
        { status: 400 }
      );
    }

    // 4. Validate optional profile picture
    if (picture !== null && !(picture instanceof File)) {
      return NextResponse.json(
        { error: "Invalid profile picture" },
        { status: 400 }
      );
    }

    if (picture instanceof File) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(picture.type)) {
        return NextResponse.json(
          { error: "Unsupported image format" },
          { status: 400 }
        );
      }

      if (picture.size === 0 || picture.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be between 1 byte and 5 MB" },
          { status: 400 }
        );
      }

      // Convert image to Buffer
      const imageBuffer = Buffer.from(
        await picture.arrayBuffer()
      );

      // 5. Update profile including picture
      const result = await pool.query(
        `UPDATE users
         SET display_name = $1,
             bio = $2,
             profile_picture = $3,
             profile_picture_type = $4,
             profile_picture_size = $5
         WHERE id = $6
         RETURNING id, username, display_name, bio, created_at`,
        [
          displayName,
          bio,
          imageBuffer,
          picture.type,
          picture.size,
          user.id,
        ]
      );

      return NextResponse.json({
        message: "Profile updated successfully",
        user: result.rows[0],
      });
    }

    // 6. Update profile without changing existing picture
    const result = await pool.query(
      `UPDATE users
       SET display_name = $1,
           bio = $2
       WHERE id = $3
       RETURNING id, username, display_name, bio, created_at`,
      [displayName, bio, user.id]
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
