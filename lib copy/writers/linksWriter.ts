import fs from "fs";
import path from "path";
import { Archive } from "../types";

export async function writeLinks(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "links.txt");

  return fs.promises.writeFile(archivePath, archive.links);
}
