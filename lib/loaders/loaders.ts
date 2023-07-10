import path from "path";
import Archive from "../types";
import { Ok, Result } from "../utils";
import { loadAbout } from "./aboutLoader";
import { loadBlogPosts } from "./blogPostLoader";
import { loadMicroBlogArchive } from "./microBlogArchiveLoader";
import { loadMicroPosts } from "./microsLoader";
import { loadMastodonPosts } from "./mastodonLoader";
import { loadStatusLolPosts } from "./statuslolLoader";
import { loadAlbumsAndPhotos } from "./albumsAndPhotosLoader";

const POSTS_DIR = "blogPosts";
const MICRO_BLOG_ARCHIVE_FILE = "microBlog/feed.json";
const MICRO_POSTS_DIR = "micros";
const ALBUMS_DIR = "albums";

const DEFAULT_ORDERED_ENTITIES = {
  entityOrder: [],
  entities: {},
};

export async function loadData(
  archive: Archive,
  cacheDir: string,
  contentDir: string
): Promise<Result<Archive>> {
  const blogPostsRequest = loadBlogPosts(
    {
      orderedEntities: archive.blogPosts ?? DEFAULT_ORDERED_ENTITIES,
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
      orderedEntities: archive.microPosts ?? DEFAULT_ORDERED_ENTITIES,
      cacheDir,
    },
    path.join(contentDir, MICRO_POSTS_DIR)
  );

  const mastodonRequest = loadMastodonPosts({
    orderedEntities: archive.mastodonPosts ?? DEFAULT_ORDERED_ENTITIES,
    cacheDir,
  });

  const statusLolRequest = loadStatusLolPosts();

  const albumRequest = loadAlbumsAndPhotos(
    archive.albums ?? DEFAULT_ORDERED_ENTITIES,
    archive.albumPhotos ?? DEFAULT_ORDERED_ENTITIES,
    path.join(contentDir, ALBUMS_DIR)
  );

  const [
    blogPostsResult,
    aboutResult,
    microBlogArchiveResult,
    microPostsResult,
    mastodonResult,
    statusLolResult,
    albumResult,
  ] = await Promise.all([
    blogPostsRequest,
    aboutRequest,
    microblogPostsRequest,
    microPostsRequest,
    mastodonRequest,
    statusLolRequest,
    albumRequest,
  ]);

  return Ok({
    blogPosts: blogPostsResult.ok ? blogPostsResult.value : archive.blogPosts,
    about: aboutResult.ok ? aboutResult.value : archive.about,
    microBlogs: microBlogArchiveResult.ok
      ? microBlogArchiveResult.value
      : archive.microBlogs,
    microPosts: microPostsResult.ok
      ? microPostsResult.value
      : archive.microPosts,
    mastodonPosts: mastodonResult.ok
      ? mastodonResult.value
      : archive.mastodonPosts,
    statusLolPosts: statusLolResult.ok
      ? statusLolResult.value
      : archive.statusLolPosts,
    albums: albumResult.ok ? albumResult.value.albums : archive.albums,
    albumPhotos: albumResult.ok
      ? albumResult.value.albumPhotos
      : archive.albumPhotos,
    lastUpdated: new Date().toISOString(),
  });
}
