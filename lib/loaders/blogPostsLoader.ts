import fs from "fs";
import path from "path";
import frontMatterParser from "front-matter";
import { Archive, BlogPostEntity, LoaderParams } from "../types";

import { arrayToRecord, getFilesRecursive, hash } from "../utils";

const POSTS_DIR = path.join(__dirname, "../../blogPosts");

async function loadBlogPost(
  archive: Archive,
  filePath: string
): Promise<BlogPostEntity> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const frontMatter = frontMatterParser(fileContents);
  const { attributes, body } = frontMatter;
  const { slug, title, date, description, tags, hero, heroAlt, showHero } =
    attributes as {
      slug: string | undefined;
      title: string | undefined;
      date: string | undefined;
      description: string | undefined;
      tags: string[] | undefined;
      hero: string | undefined;
      heroAlt: string | undefined;
      showHero: boolean | undefined;
    };

  if (!slug || !title || !date || !description) {
    throw new Error(`Blog post is missing required attributes: ${filePath}`);
  }

  if (hero && !heroAlt) {
    throw new Error(`Blog post is missing hero image alt text: ${filePath}`);
  }

  const data: Omit<BlogPostEntity, "rawDataHash"> = {
    type: "blogPost",
    id: slug,
    url: `/blog/${slug}/index.html`,
    title,
    date: new Date(date).toISOString(),
    description,
    content: body,
    tags: tags ?? [],
    hero:
      hero && heroAlt
        ? { url: hero, alt: heroAlt, showHero: showHero ?? false }
        : null,
    media: [], // TODO
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
