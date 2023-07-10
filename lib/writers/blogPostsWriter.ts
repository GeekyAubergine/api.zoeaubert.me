import path from "path";
import { Result, writeFile } from "../utils";
import Archive from "../types";

export async function writeBlogPosts(
  outputDir: string,
  archive: Archive
): Promise<Result<undefined>> {
  const archivePath = path.join(outputDir, "blog-posts.json");

  return writeFile(archivePath, JSON.stringify(archive.blogPosts, null, 2));
}
