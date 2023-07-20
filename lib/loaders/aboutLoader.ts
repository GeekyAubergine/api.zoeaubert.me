import { Result, readMarkdownFile } from "../utils";
import path from "path";

const FILE_NAME = "about.md";

export async function loadAbout(contentDir: string): Promise<Result<string>> {
  return readMarkdownFile(path.join(contentDir, FILE_NAME));
}
