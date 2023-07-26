import path from "path";
import { Result, writeFile } from "../utils";
import { Data } from "../types";

export async function writeNow(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "now.md");

  return writeFile(outputPath, data.now);
}
