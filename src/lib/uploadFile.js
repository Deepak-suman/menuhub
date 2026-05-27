import { promises as fs } from "fs";
import path from "path";

/**
 * Saves an uploaded file to the local filesystem.
 * @param {File} file - The file object from form data.
 * @param {string} context - The subfolder name (restaurantId or 'super-admin').
 * @returns {Promise<string|null>} - Returns the API URL or null on failure.
 */
export async function saveUploadedFile(file, context = "general") {
  if (!file || typeof file === 'string') return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Define folder path in root 'uploads' directory
    const uploadDir = path.join(process.cwd(), "uploads", context);

    // 2. Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // 3. Generate unique filename based on original name (Sanitized)
    const originalName = file.name;
    const fileExt = path.extname(originalName) || ".jpg";
    const baseName = path.basename(originalName, fileExt)
      .replace(/\s+/g, "_")                    // Replace spaces with _
      .replace(/[^a-zA-Z0-9\._-]/g, "");       // Remove special characters

    let fileName = `${baseName}${fileExt}`;
    let filePath = path.join(uploadDir, fileName);
    let counter = 1;

    // Check if file already exists, and if so, append -copy or -copy-N
    while (true) {
      try {
        await fs.access(filePath);
        // File exists, modify name
        const suffix = counter === 1 ? "-copy" : `-copy-${counter}`;
        fileName = `${baseName}${suffix}${fileExt}`;
        filePath = path.join(uploadDir, fileName);
        counter++;
      } catch {
        // File does not exist, we are good to go
        break;
      }
    }

    // 4. Write file binary data to disk
    await fs.writeFile(filePath, buffer);

    // 5. Return the URL path that our API route can serve
    return `/api/uploads/${context}/${fileName}`;
  } catch (error) {
    console.error("File processing error:", error);
    return null;
  }
}
