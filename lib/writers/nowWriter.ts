import fs from "fs";
import path from "path";
import { Archive } from "../types";

export async function writeNow(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "now.txt");

  return fs.promises.writeFile(archivePath, archive.now);
}
