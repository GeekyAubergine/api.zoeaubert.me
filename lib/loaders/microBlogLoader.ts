import fs from "fs";
import { arrayToRecord, cleanTag, CONTENT_TO_FILTER_OUT, hash } from "../utils";

import { EntityMedia, LoaderParams, MicroBlogEntity } from "../types";

const REGEX_IMAGES = /<img src="(.*?)".*?alt="(.*?)"/gm;

function mapMicroBlog(microBlog: any): MicroBlogEntity {
  const slug = microBlog.id.replace(
    "http://geekyaubergine.micro.blog/",
    "/micros/"
  );

  const date = new Date(microBlog.date_published).toISOString();

  const content = microBlog.content_text.replace(
    /uploads\//g,
    "https://cdn.geekyaubergine.com/"
  );

  const imagesMatch = (content as string).matchAll(REGEX_IMAGES);

  const media: EntityMedia[] = [];

  for (const match of imagesMatch) {
    const [, url, alt] = match;
    if (!url || !alt) {
      continue;
    }
    media.push({
      type: "image",
      url,
      alt,
      date,
    });
  }

  const firstLine = content.split("\n")[0];

  const data: Omit<MicroBlogEntity, "rawDataHash"> = {
    type: "microblog",
    id: slug,
    slug,
    date,
    content,
    excerpt: firstLine ?? "",
    media,
    tags: (microBlog.tags ?? []).map(cleanTag),
  };

  const rawDataHash = hash(data);

  return {
    ...data,
    rawDataHash,
  };
}

export async function loadMicroBlog(
  _: LoaderParams
): Promise<Record<string, MicroBlogEntity>> {
  const archiveContents = await fs.promises.readFile(
    "./microBlog/feed.json",
    "utf8"
  );

  const archive = JSON.parse(archiveContents);

  const mapped: MicroBlogEntity[] = archive.items
    .map(mapMicroBlog)
    .filter(
      (micro: MicroBlogEntity) =>
        !CONTENT_TO_FILTER_OUT.test(micro.content) &&
        !micro.tags.includes("status") &&
        !micro.tags.includes("photography")
    );

  return arrayToRecord(mapped, (micro) => micro.id);
}
