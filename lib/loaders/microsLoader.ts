import fs from "fs";
import path from "path";
import frontMatterParser from "front-matter";
import { Archive, EntityMedia, LoaderParams, MicroEntity } from "../types";

import {
  arrayToRecord,
  cleanTag,
  formatDateAsSlugPart,
  getFilesRecursive,
  hash,
} from "../utils";

const POSTS_DIR = path.join(__dirname, "../../micros");

const IMAGE_REGEX = /!\[([^\]]+)\]\(([^\)]+)\)/g;

async function loadMicro(
  archive: Archive,
  filePath: string
): Promise<MicroEntity> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const frontMatter = frontMatterParser(fileContents);
  const { attributes, body } = frontMatter;
  const { date, tags } = attributes as {
    date: string | undefined;
    tags: string[] | undefined;
  };

  const slug = path.basename(filePath).replace(".md", "");

  if (!date) {
    throw new Error(`Blog post is missing required attributes: ${filePath}`);
  }

  const postSlug = `/micros/${formatDateAsSlugPart(new Date(date))}/${slug}`;
  const dateString = new Date(date).toISOString();

  const imagesMatch = body.matchAll(IMAGE_REGEX);

  const media: EntityMedia[] = [];

  for (const image of imagesMatch) {
    const [, alt, url] = image;

    if (!alt) {
      throw new Error(
        `Blog post is missing alt text for image: ${url} in ${filePath}`
      );
    }

    if (!url) {
      throw new Error(
        `Blog post is missing url for image: ${alt} in ${filePath}`
      );
    }

    media.push({
      url,
      alt,
      postSlug,
      type: "image",
      date: dateString,
      width: 2000,
      height: 2000,
    });
  }

  const data: Omit<MicroEntity, "rawDataHash"> = {
    type: "micro",
    id: postSlug,
    slug: postSlug,
    date: dateString,
    content: body,
    tags: (tags ?? []).map(cleanTag),
    media,
  };

  const rawDataHash = hash(data);

  const existingEntity = archive.entities[data.id];

  if (existingEntity && existingEntity.rawDataHash === rawDataHash) {
    return existingEntity as MicroEntity;
  }

  console.log(`Updating micro post: ${data.id} (${data.slug})`);

  return {
    ...data,
    rawDataHash,
  };
}

export async function loadMicros(
  loaderParams: LoaderParams
): Promise<Record<string, MicroEntity>> {
  const { archive } = loaderParams;

  const paths = await getFilesRecursive(POSTS_DIR, ".md");

  const posts = await Promise.all(
    paths.map((path) => loadMicro(archive, path))
  );

  return arrayToRecord(posts, (post) => post.id);
}
