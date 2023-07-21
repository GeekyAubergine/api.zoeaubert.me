import path from "path";
import { Result, writeJSONFile } from "../utils";
import Data from "../types";

export async function writeLego(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "lego.json");

  return writeJSONFile(outputPath, data.lego);
}
