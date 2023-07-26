import path from "path";
import { Result, writeJSONFile } from "../utils";
import { Data } from "../types";

export async function writeBlogPosts(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "blog-posts.json");
  
  return writeJSONFile(outputPath, data.blogPosts);
}
