import path from "path";
import frontMatterParser from "front-matter";
import {
  Err,
  Ok,
  Result,
  parseImagesFromMarkdown,
  getFilesRecursive,
  cleanTags,
  readFile,
} from "../utils";
import { SourceDataImage } from "lib/types";

export type SourceDataMicroPost = {
  key: string;
  title: string;
  date: string;
  content: string;
  tags: string[];
  images: SourceDataImage[];
};

export type SourceDataMicroPosts = Record<string, SourceDataMicroPost>;

export const DEFAULT_SOURCE_DATA_MICRO_POSTS: SourceDataMicroPosts = {};

async function loadMicroPost(
  filePath: string
): Promise<Result<SourceDataMicroPost>> {
  const fileContents = await readFile(filePath);

  if (!fileContents.ok) {
    return fileContents;
  }

  const frontMatter = frontMatterParser(fileContents.value);
  const { attributes, body } = frontMatter;
  const { date, tags } = attributes as {
    date: string | undefined;
    tags: string[] | undefined;
  };

  if (!date) {
    return Err({
      type: "MICRO_POST_MISSING_DATE",
      url: filePath,
    });
  }

  const title = path.basename(filePath).replace(".md", "");

  const key = `${title}-${date}`;

  const imagesResult = await parseImagesFromMarkdown(filePath, body);

  if (!imagesResult.ok) {
    return imagesResult;
  }

  return Ok({
    key,
    title,
    date,
    content: body,
    tags: cleanTags(tags ?? []),
    images: imagesResult.value,
  });
}

export async function loadMicroPosts(
  previousData: SourceDataMicroPosts,
  microsDir: string
): Promise<Result<SourceDataMicroPosts>> {
  const paths = await getFilesRecursive(microsDir, ".md");

  if (!paths.ok) {
    return paths;
  }

  const microPosts = { ...previousData };

  for (const filePath of paths.value) {
    const result = await loadMicroPost(filePath);

    if (!result.ok) {
      return result;
    }

    const { value } = result;

    microPosts[value.key] = value;
  }

  return Ok(microPosts);
}
