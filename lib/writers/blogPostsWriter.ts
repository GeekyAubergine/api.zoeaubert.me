import fs from "fs";
import { archiveEntitiesOfTypeInOrder } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeBlogPosts(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "blogPosts.json");

  const posts = archiveEntitiesOfTypeInOrder(archive, "blogPost");

  return fs.promises.writeFile(archivePath, JSON.stringify(posts, null, 2));
}
