import { Ok, Result, readMarkdownFile } from "../utils";
import path from "path";

const FILE_NAME = "faq.md";

export type SourceDataFaq = {
  content: string;
};

export const DEFAULT_SOURCE_DATA_FAQ: SourceDataFaq = {
  content: "",
};

export async function loadFaq(contentDir: string): Promise<Result<SourceDataFaq>> {
  const md = await readMarkdownFile(path.join(contentDir, FILE_NAME));

  if (!md.ok) {
    return md;
  }

  return Ok({
    content: md.value,
  });
}
