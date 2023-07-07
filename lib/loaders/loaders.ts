import path from "path";
import Archive from "../types";
import { Ok, Result } from "../utils";
import { loadAbout } from "./aboutLoader";
import { loadBlogPosts } from "./blogPostLoader";
import { loadMicroBlogArchive } from "./microBlogArchiveLoader";
import { loadMicroPosts } from "./microsLoader";
import { loadMastodonPosts } from "./mastodonLoader";

const POSTS_DIR = "blogPosts";
const MICRO_BLOG_ARCHIVE_FILE = "microBlog/feed.json";
const MICRO_POSTS_DIR = "micros";

export async function loadData(
  archive: Archive,
  cacheDir: string,
  contentDir: string
): Promise<Result<Archive>> {
  const blogPostsRequest = loadBlogPosts(
    {
      orderedEntities: archive.blogPosts,
      cacheDir,
    },
    path.join(contentDir, POSTS_DIR)
  );

  const aboutRequest = loadAbout();

  const microblogPostsRequest = loadMicroBlogArchive(
    path.join(contentDir, MICRO_BLOG_ARCHIVE_FILE)
  );

  const microPostsRequest = loadMicroPosts(
    {
      orderedEntities: archive.microPosts,
      cacheDir,
    },
    path.join(contentDir, MICRO_POSTS_DIR)
  );

  const masterRequest = loadMastodonPosts({
    orderedEntities: archive.mastodonPosts,
    cacheDir,
  });

  const [
    blogPostsResult,
    aboutResult,
    microBlogArchiveResult,
    microPostsResult,
    mastodonResult,
  ] = await Promise.all([
    blogPostsRequest,
    aboutRequest,
    microblogPostsRequest,
    microPostsRequest,
    masterRequest,
  ]);

  if (!blogPostsResult.ok) {
    return blogPostsResult;
  }

  if (!aboutResult.ok) {
    return aboutResult;
  }

  if (!microBlogArchiveResult.ok) {
    return microBlogArchiveResult;
  }

  if (!microPostsResult.ok) {
    return microPostsResult;
  }

  if (!mastodonResult.ok) {
    return mastodonResult;
  }

  return Ok({
    blogPosts: blogPostsResult.value,
    microBlogs: microBlogArchiveResult.value,
    microPosts: microPostsResult.value,
    mastodonPosts: mastodonResult.value,
    about: aboutResult.value,
    lastUpdated: new Date().toISOString(),
  });
}
