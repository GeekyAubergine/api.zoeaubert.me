import fs from "fs";
import path from "path";
import { Archive } from "../types";

export async function writeFaq(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "faq.txt");

  return fs.promises.writeFile(archivePath, archive.faq);
}
