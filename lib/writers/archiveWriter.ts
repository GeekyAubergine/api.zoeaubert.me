import path from "path";
import { Result, writeJSONFile } from "../utils";
import Data from "../types";

export async function writeArchive(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "archive.json");

  return writeJSONFile(outputPath, data);
}
