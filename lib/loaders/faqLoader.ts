import { Result, readMarkdownFile } from "../utils";
import path from "path";

const FILE_NAME = "faq.md";

export async function loadFaq(contentDir: string): Promise<Result<string>> {
  return readMarkdownFile(path.join(contentDir, FILE_NAME));
}
