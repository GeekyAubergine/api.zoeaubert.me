import fs from "fs";
import path from "path";
import frontMatterParser from "front-matter";
import { BlogPostEntity } from "../types";

import { getFilesRecursive } from "../utils";

const POSTS_DIR = path.join(__dirname, "../../blogPosts");

async function loadBlogPost(filePath: string): Promise<BlogPostEntity> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const frontMatter = frontMatterParser(fileContents);
  const { attributes, body } = frontMatter;
  // @ts-expect-error It doesn't know these exist
  const { slug, title, date, description, tags, heroImage, heroImageAlt } =
    attributes;

  return {
    type: "blogPost",
    slug,
    title,
    date: new Date(date),
    description,
    content: body,
    tags,
    heroImage:
      heroImage && heroImageAlt ? { url: heroImage, alt: heroImageAlt } : null,
  };
}

export async function loadBlogPosts(): Promise<BlogPostEntity[]> {
  const paths = await getFilesRecursive(POSTS_DIR, ".md");

  return Promise.all(paths.map(loadBlogPost));
}
