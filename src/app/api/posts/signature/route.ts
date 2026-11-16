import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST() {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "instagram-clone/reels";

    // Automatically reads credentials from process.env.CLOUDINARY_URL
    const { api_secret, api_key, cloud_name } = cloudinary.config();

    if (!api_secret || !api_key || !cloud_name) {
      throw new Error("Missing Cloudinary configuration from CLOUDINARY_URL");
    }

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      api_secret
    );

    return NextResponse.json({
      timestamp,
      signature,
      cloudName: cloud_name,
      apiKey: api_key,
      folder,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
