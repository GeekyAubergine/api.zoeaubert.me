import path from "path";
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeBlogPosts(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "blog-posts.json");

  const out = {
    ...data.blogPosts,
    recentPosts: data.blogPosts.entityOrder.slice(0, 5),
  }

  return writeFile(outputPath, JSON.stringify(out, null, 2));
}
