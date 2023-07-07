import fs from "fs-extra";

import {
  CONTENT_TO_FILTER_OUT,
  Err,
  Ok,
  Result,
  cleanTags,
  entitiesToOrderedEntities,
  hash,
} from "../utils";
import { EntityMedia, MicroBlogEntity, MicroBlogs } from "../types";

const REGEX_IMAGES =
  /<img src="(.*?)".*?width="(.*?)".*?height="(.*?)".*?alt="(.*?)"/gm;

function mapMicroBlog(microBlog: any): MicroBlogEntity {
  const permalink = microBlog.id
    .replace("http://geekyaubergine.micro.blog/", "/micros/")
    .replace(".html", "");

  const date = new Date(microBlog.date_published).toISOString();

  const content = microBlog.content_text.replace(
    /uploads\//g,
    "https://cdn.geekyaubergine.com/"
  );

  const imagesMatch = (content as string).matchAll(REGEX_IMAGES);

  const media: EntityMedia[] = [];

  for (const match of imagesMatch) {
    const [, src, width, height, alt] = match;
    // No need to throw error as we trust this data as it's been previously validated and is never updated
    if (!src || !alt || !width || !height) {
      continue;
    }
    media.push({
      image: {
        src,
        alt,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
      },
      date,
      parentPermalink: permalink,
    });
  }

  const firstLine = content.split("\n")[0];

  const data: Omit<MicroBlogEntity, "rawDataHash"> = {
    type: "microBlog",
    key: permalink,
    permalink,
    date,
    content,
    description: firstLine ?? "",
    media,
    tags: cleanTags(microBlog.tags ?? []),
  };

  const rawDataHash = hash(data);

  return {
    ...data,
    rawDataHash,
  };
}

export async function loadMicroBlogArchive(
  microBlogArchivePath: string
): Promise<Result<MicroBlogs>> {
  try {
    const archiveContents = await fs.readFile(microBlogArchivePath, "utf-8");

    const archive = JSON.parse(archiveContents);

    const mapped: MicroBlogEntity[] = archive.items
      .map(mapMicroBlog)
      .filter(
        (micro: MicroBlogEntity) =>
          !CONTENT_TO_FILTER_OUT.test(micro.content) &&
          !micro.tags.includes("status") &&
          !micro.tags.includes("Status") &&
          !micro.tags.includes("photography") &&
          !micro.tags.includes("Photography")
      );

    return Ok(entitiesToOrderedEntities(mapped));
  } catch (e) {
    return Err({
      type: "UNABLE_TO_READ_FILE",
      path: microBlogArchivePath,
    });
  }
}
