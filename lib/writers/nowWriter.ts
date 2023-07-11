import path from "path";
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeNow(
  outputDir: string,
  archive: Data
): Promise<Result<undefined>> {
  const archivePath = path.join(outputDir, "now.md");

  return writeFile(archivePath, archive.now);
}
