import fs from "fs-extra";
import frontMatterParser from "front-matter";

import {
  BlogPostEntity,
  BlogPosts,
  EntityMedia,
  SourceDataImage,
} from "../types";
import {
  Err,
  Ok,
  Result,
  cleanTags,
  entitiesToOrderedEntities,
  getFilesRecursive,
  getImageOrientation,
  parseImagesFromMarkdown,
} from "../utils";

export type SourceDataBlogPost = {
  key: string;
  title: string;
  date: string;
  description: string;
  content: string;
  tags: string[];
  hero: SourceDataImage | null;
  images: SourceDataImage[];
};

export type SourceDataBlogPosts = Record<string, SourceDataBlogPost>;

export const DEFAULT_SOURCE_DATA_BLOG_POSTS: SourceDataBlogPosts = {};

function parseHeroImage(
  filePath: string,
  hero: string | undefined,
  heroAlt: string | undefined,
  heroWidth: number | undefined,
  heroHeight: number | undefined
): Result<SourceDataImage | null> {
  if (!hero) {
    return Ok(null);
  }

  if (!heroAlt) {
    return Err({
      type: "BLOG_POST_HERO_MISSING_ALT",
      url: filePath,
    });
  }

  if (!heroWidth || !heroHeight) {
    return Err({
      type: "BLOG_POST_HERO_MISSING_WIDTH_OR_HEIGHT",
      url: filePath,
    });
  }

  return Ok({
    src: hero,
    alt: heroAlt,
    width: heroWidth,
    height: heroHeight,
    title: heroAlt,
    orientation: getImageOrientation(heroWidth, heroHeight),
  });
}

async function loadBlogPost(
  filePath: string
): Promise<Result<SourceDataBlogPost>> {
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

  if (!slug) {
    return Err({
      type: "BLOG_POST_MISSING_SLUG",
      url: filePath,
    });
  }

  if (!title) {
    return Err({
      type: "BLOG_POST_MISSING_TITLE",
      url: filePath,
    });
  }

  if (!date) {
    return Err({
      type: "BLOG_POST_MISSING_DATE",
      url: filePath,
    });
  }

  if (!description) {
    return Err({
      type: "BLOG_POST_MISSING_DESCRIPTION",
      url: filePath,
    });
  }

  const key = slug;

  const heroImageResult = parseHeroImage(
    filePath,
    hero,
    heroAlt,
    heroWidth,
    heroHeight
  );

  if (!heroImageResult.ok) {
    return heroImageResult;
  }

  const heroImage = heroImageResult.value;

  const dateString = new Date(date).toISOString();

  const images = await parseImagesFromMarkdown(filePath, body);

  if (!images.ok) {
    return images;
  }

  return Ok({
    type: "blogPost",
    key,
    title,
    date: dateString,
    description,
    content: body,
    tags: cleanTags(tags),
    hero: heroImage,
    showHero: showHero || false,
    images: images.value,
  });
}

export async function loadBlogPosts(
  previousData: SourceDataBlogPosts,
  postsDir: string
): Promise<Result<SourceDataBlogPosts>> {
  const paths = await getFilesRecursive(postsDir, ".md");

  if (!paths.ok) {
    return Ok(previousData);
  }

  const blogPosts: SourceDataBlogPosts = { ...previousData };

  for (const filePath of paths.value) {
    const result = await loadBlogPost(filePath);

    if (!result.ok) {
      return result;
    }

    const { value } = result;

    blogPosts[value.key] = value;
  }

  return Ok(blogPosts);
}
