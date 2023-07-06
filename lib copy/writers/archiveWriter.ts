import fs from "fs";
import path from "path";
import { Archive } from "../types";

export async function writeArchive(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "archive.json");

  return fs.promises.writeFile(archivePath, JSON.stringify(archive, null, 2));
}
