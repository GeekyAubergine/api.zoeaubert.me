import Archive from "../types";
import { Ok, Result } from "../utils";
import { loadBlogPosts } from "./blogPostLoader";

const POSTS_DIR = "blogPosts";

export async function loadData(
  archive: Archive,
  cacheDir: string,
  contentDir: string
): Promise<Result<Archive>> {
  const blogPostsResponse = await loadBlogPosts(
    {
      orderedEntities: archive.blogPosts,
      cacheDir,
    },
    `${contentDir}/${POSTS_DIR}`
  );

  if (!blogPostsResponse.ok) {
    return blogPostsResponse;
  }

  const blogPosts = blogPostsResponse.value;

  return Ok({
    blogPosts,
  });
}
