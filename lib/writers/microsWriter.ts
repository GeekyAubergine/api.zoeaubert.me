import fs from "fs";
import { filterOrderedEntitiesBy } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeMicros(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "micros.json");

  const out = filterOrderedEntitiesBy(
    archive,
    (entity) =>
      entity.type === "statuslol" ||
      entity.type === "microblog" ||
      entity.type === "mastodon" ||
      entity.type === "micro" ||
      (entity.type === "blogPost" && entity.tags.includes("micro"))
  );

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
