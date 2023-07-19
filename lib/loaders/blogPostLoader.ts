import fs from "fs-extra";
import frontMatterParser from "front-matter";

import {
  BlogPostEntity,
  BlogPosts,
  EntityMedia,
  Image,
  LoaderParams,
} from "../types";
import {
  Err,
  Ok,
  Result,
  cleanTags,
  entitiesToOrderedEntities,
  getFilesRecursive,
  hash,
  parseImagesFromMarkdown,
} from "../utils";

function parseHeroImage(
  filePath: string,
  hero: string | undefined,
  heroAlt: string | undefined,
  heroWidth: number | undefined,
  heroHeight: number | undefined
): Result<Image | null> {
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
  });
}

async function loadBlogPost(
  loaderParams: LoaderParams<BlogPostEntity>,
  filePath: string
): Promise<Result<BlogPostEntity>> {
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

  const rawDataHash = hash({
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
  });

  const key = slug;

  const existingPost = loaderParams.orderedEntities.entities[key];

  if (existingPost && existingPost.rawDataHash === rawDataHash) {
    return Ok(existingPost);
  }

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

  const permalink = `/blog/${slug}`;
  const dateString = new Date(date).toISOString();

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

  console.log(`Updating blog post: ${key} (${title})`);

  return Ok({
    type: "blogPost",
    key,
    permalink,
    title,
    date: dateString,
    description,
    content: body,
    tags: cleanTags(tags),
    hero: heroImage,
    showHero: showHero || false,
    media,
    rawDataHash,
    firstLine: body.split("\n")[0] ?? "",
  });
}

export async function loadBlogPosts(
  loaderParams: LoaderParams<BlogPostEntity>,
  postsDir: string
): Promise<Result<BlogPosts>> {
  const paths = await getFilesRecursive(postsDir, ".md");

  const blogPosts: BlogPostEntity[] = [];

  for (const filePath of paths) {
    const result = await loadBlogPost(loaderParams, filePath);

    if (!result.ok) {
      return result;
    }

    blogPosts.push(result.value);
  }

  return Ok(entitiesToOrderedEntities(blogPosts));
}
