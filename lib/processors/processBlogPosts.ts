import { Ok, Result } from "../utils";
import { DataBlogPosts, DataImage } from "../types";
import { SourceData } from "../loaders/loaders";
import { processImage } from "./processors";
import { logError } from "../loggger";

export async function processBlogPosts(
  sourceData: SourceData
): Promise<Result<DataBlogPosts>> {
  if (!sourceData.blogPosts) {
    return Ok({});
  }

  const keys = Object.keys(sourceData.blogPosts);

  const blogPosts: DataBlogPosts = {};

  for (const key of keys) {
    const sourceBlogPost = sourceData.blogPosts[key];

    if (!sourceBlogPost) {
      continue;
    }

    const permalink = `/blog/${key}`;

    let heroImage: DataImage | null = null;
    if (sourceBlogPost.hero) {
      const heroImageResult = await processImage({
        sourceImage: sourceBlogPost.hero,
        parentPermalink: permalink,
        date: sourceBlogPost.date,
      });

      if (heroImageResult.ok) {
        heroImage = heroImageResult.value;
      } else {
        logError(heroImageResult);
      }
    }

    let images: DataImage[] = [];

    for (const image of sourceBlogPost.images) {
      const imageResult = await processImage({
        sourceImage: image,
        parentPermalink: permalink,
        date: sourceBlogPost.date,
      });

      if (imageResult.ok) {
        images.push(imageResult.value);
      } else {
        logError(imageResult);
      }
    }

    blogPosts[key] = {
      key,
      permalink,
      title: sourceBlogPost.title,
      date: sourceBlogPost.date,
      description: sourceBlogPost.description,
      content: sourceBlogPost.content,
      tags: sourceBlogPost.tags,
      hero: heroImage,
      images,
    };
  }

  return Ok(blogPosts);
}
