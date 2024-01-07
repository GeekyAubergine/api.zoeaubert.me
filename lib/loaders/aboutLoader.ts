import { Ok, Result, readMarkdownFile } from "../utils";
import path from "path";

const FILE_NAME = "about.md";

export type SourceDatadAbout = {
  content: string;
};

export const DEFAULT_SOURCE_DATA_ABOUT: SourceDatadAbout = {
  content: "",
};

export async function loadAbout(
  contentDir: string
): Promise<Result<SourceDatadAbout>> {
  const md = await readMarkdownFile(path.join(contentDir, FILE_NAME));

  if (!md.ok) {
    return md;
  }

  return Ok({
    content: md.value,
  });
}
