import path from "path";
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeBlogPosts(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "blog-posts.json");
  
  return writeFile(outputPath, JSON.stringify(data.blogPosts, null, 2));
}
