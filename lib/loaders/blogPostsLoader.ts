import fs from "fs";
import path from "path";
import frontMatterParser from "front-matter";
import { Archive, BlogPostEntity, EntityMedia, LoaderParams } from "../types";

import { arrayToRecord, cleanTag, getFilesRecursive, hash } from "../utils";

const POSTS_DIR = path.join(__dirname, "../../blogPosts");

const IMAGE_REGEX = /!\[([^\]]+)\]\(([^\)]+)\)/g;

async function loadBlogPost(
  archive: Archive,
  filePath: string
): Promise<BlogPostEntity> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const frontMatter = frontMatterParser(fileContents);
  const { attributes, body } = frontMatter;
  const {
    slug,
    title,
    date,
    description,
    tags,
    hero,
    heroAlt,
    showHero,
    heroWidth,
    heroHeight,
  } = attributes as {
    slug: string | undefined;
    title: string | undefined;
    date: string | undefined;
    description: string | undefined;
    tags: string[] | undefined;
    hero: string | undefined;
    heroAlt: string | undefined;
    showHero: boolean | undefined;
    heroWidth: number | undefined;
    heroHeight: number | undefined;
  };

  if (!slug || !title || !date || !description) {
    throw new Error(`Blog post is missing required attributes: ${filePath}`);
  }

  if (hero && !heroAlt) {
    throw new Error(`Blog post is missing hero image alt text: ${filePath}`);
  }

  if (hero && (!heroWidth || !heroHeight)) {
    console.log({ attributes })
    throw new Error(`Blog post is missing hero image dimensions: ${filePath}`);
  }

  const postSlug = `/blog/${slug}`;
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

  const data: Omit<BlogPostEntity, "rawDataHash"> = {
    type: "blogPost",
    id: slug,
    slug: postSlug,
    title,
    date: dateString,
    description,
    content: body,
    tags: (tags ?? []).map(cleanTag),
    hero:
      hero && heroAlt
        ? {
            url: hero,
            alt: heroAlt,
            showHero: showHero ?? false,
            width: heroWidth ?? 0,
            height: heroHeight ?? 0,
          }
        : null,
    media,
  };

  const rawDataHash = hash(data);

  const existingEntity = archive.entities[data.id];

  if (existingEntity && existingEntity.rawDataHash === rawDataHash) {
    return existingEntity as BlogPostEntity;
  }

  console.log(`Updating blog post: ${data.id} (${data.title})`);

  return {
    ...data,
    rawDataHash,
  };
}

export async function loadBlogPosts(
  loaderParams: LoaderParams
): Promise<Record<string, BlogPostEntity>> {
  const { archive } = loaderParams;

  const paths = await getFilesRecursive(POSTS_DIR, ".md");

  const posts = await Promise.all(
    paths.map((path) => loadBlogPost(archive, path))
  );

  return arrayToRecord(posts, (post) => post.id);
}
