import fs from "fs";
import path from "path";
import { Entity } from "../types";

export async function writeArchive(
  outputDir: string,
  entities: Entity[]
): Promise<void> {
  const archivePath = path.join(outputDir, "archive.json");

  return fs.promises.writeFile(archivePath, JSON.stringify(entities, null, 2));
}
