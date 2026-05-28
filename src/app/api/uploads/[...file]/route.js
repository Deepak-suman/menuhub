import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { file } = await params;
    const filename = file.join("/");
    
    const rootUploadsDir = path.resolve(process.cwd(), "uploads");
    const filePath = path.resolve(rootUploadsDir, filename);
    
    // STRICT SECURITY CHECK: Enforce path boundary constraint to prevent directory traversal
    if (!filePath.startsWith(rootUploadsDir)) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    const data = await fs.readFile(filePath);
    
    // Extrapolate basic mime type from extension
    const ext = path.extname(filename).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    if (ext === ".gif") mimeType = "image/gif";
    if (ext === ".webp") mimeType = "image/webp";

    return new NextResponse(data, {
      status: 200,
      headers: { "Content-Type": mimeType }
    });
  } catch (error) {
    return new NextResponse("File not found", { status: 404 });
  }
}
