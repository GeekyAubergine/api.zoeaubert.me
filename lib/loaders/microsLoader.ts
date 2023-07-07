import fs from "fs";
import path from "path";
import frontMatterParser from "front-matter";
import {
  EntityMedia,
  LoaderParams,
  MicroPostEntity,
  MicroPosts,
} from "../types";
import {
  Err,
  Ok,
  Result,
  entitiesToOrderedEntities,
  formatDateAsSlugPart,
  hash,
  parseImagesFromMarkdown,
  cleanTag,
  getFilesRecursive,
} from "../utils";

async function loadMicroPost(
  loaderParams: LoaderParams<MicroPostEntity>,
  filePath: string
): Promise<Result<MicroPostEntity>> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const frontMatter = frontMatterParser(fileContents);
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

  const rawDataHash = hash({
    key,
    date,
    tags: (tags ?? []).join(","),
    body,
  });

  const permalink = `/micros/${formatDateAsSlugPart(new Date(date))}/${title}`;

  const existingPost = loaderParams.orderedEntities.entities[key];

  if (existingPost && existingPost.rawDataHash === rawDataHash) {
    return Ok(existingPost);
  }

  const mediaResult = await parseImagesFromMarkdown(filePath, body);

  if (!mediaResult.ok) {
    return mediaResult;
  }

  const media: EntityMedia[] = mediaResult.value.map(
    (image): EntityMedia => ({
      image,
      parentPermalink: permalink,
      date,
    })
  );

  const firstLine = body.split(/\/n/)[0]?.replace(/\[(.*?)]\(.*?\)/g, "$1");

  console.log(`Updating micro post: ${key} (${date})`);

  return Ok({
    type: "microPost",
    key,
    permalink,
    date,
    content: body,
    tags: (tags ?? []).map(cleanTag),
    media,
    description: firstLine ?? "",
    rawDataHash,
  });
}

export async function loadMicroPosts(
  loaderParams: LoaderParams<MicroPostEntity>,
  microsDir: string
): Promise<Result<MicroPosts>> {
  const paths = await getFilesRecursive(microsDir, ".md");

  const microPosts: MicroPostEntity[] = [];

  for (const filePath of paths) {
    const result = await loadMicroPost(loaderParams, filePath);

    if (!result.ok) {
      return result;
    }

    microPosts.push(result.value);
  }

  return Ok(entitiesToOrderedEntities(microPosts));
}
