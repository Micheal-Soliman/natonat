import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

export async function GET() {
  try {
    const reviewsDir = path.join(process.cwd(), "public", "reviews");
    const files = await readdir(reviewsDir);

    const images = files
      .filter((file) => {
        const extension = path.extname(file).toLowerCase();
        return allowedExtensions.includes(extension) && !file.startsWith(".");
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file, index) => ({
        id: index + 1,
        fileName: file,
        src: `/reviews/${encodeURIComponent(file)}`,
        alt: `Customer review ${index + 1}`,
      }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("[Reviews API] Failed to read reviews folder:", error);

    return NextResponse.json(
      {
        images: [],
        error: "Reviews folder not found or empty",
      },
      { status: 200 }
    );
  }
}