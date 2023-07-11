import path from "path";
import { Result, writeFile } from "../utils";
import Archive from "../types";

export async function writeBlogPosts(
  outputDir: string,
  archive: Archive
): Promise<Result<undefined>> {
  const archivePath = path.join(outputDir, "blog-posts.json");

  const out = {
    ...archive.blogPosts,
    recentPosts: archive.blogPosts.entityOrder.slice(0, 5),
  }

  return writeFile(archivePath, JSON.stringify(out, null, 2));
}
