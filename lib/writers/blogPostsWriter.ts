import fs from "fs";
import { filterOrderedEntitiesBy } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeBlogPosts(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "blog-posts.json");

  const out = filterOrderedEntitiesBy(
    archive,
    (entity) => entity.type === "blogPost"
  );

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
