import fs from "fs";
import path from "path";
import { Entity } from "../types";

export async function writeBlogPosts(
  outputDir: string,
  entities: Entity[]
): Promise<void> {
  const archivePath = path.join(outputDir, "blogPosts.json");

  const posts = entities.filter((e) => e.type === "blogPost");

  return fs.promises.writeFile(archivePath, JSON.stringify(posts, null, 2));
}
