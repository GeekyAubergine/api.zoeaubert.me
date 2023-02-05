import fs from "fs";
import path from "path";
import { Archive } from "../types";

export async function writeAll(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "all.json");

  const { entities, entityOrder } = archive;

  return fs.promises.writeFile(archivePath, JSON.stringify({
    entities,
    entityOrder,
  }, null, 2));
}
