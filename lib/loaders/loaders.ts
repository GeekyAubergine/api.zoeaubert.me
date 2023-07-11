import path from "path";
import Data from "../types";
import { Ok, Result } from "../utils";
import { loadAbout } from "./aboutLoader";
import { loadBlogPosts } from "./blogPostLoader";
import { loadMicroBlogArchive } from "./microBlogArchiveLoader";
import { loadMicroPosts } from "./microsLoader";
import { loadMastodonPosts } from "./mastodonLoader";
import { loadStatusLolPosts } from "./statuslolLoader";
import { loadAlbumsAndPhotos } from "./albumsAndPhotosLoader";
import { loadFaq } from "./faqLoader";
import { loadNow } from "./nowLoader";

const POSTS_DIR = "blogPosts";
const MICRO_BLOG_ARCHIVE_FILE = "microBlog/feed.json";
const MICRO_POSTS_DIR = "micros";
const ALBUMS_DIR = "albums";

const DEFAULT_ORDERED_ENTITIES = {
  entityOrder: [],
  entities: {},
};

export async function loadData(
  data: Data,
  cacheDir: string,
  contentDir: string
): Promise<Result<Data>> {
  const blogPostsRequest = loadBlogPosts(
    {
      orderedEntities: data.blogPosts ?? DEFAULT_ORDERED_ENTITIES,
      cacheDir,
    },
    path.join(contentDir, POSTS_DIR)
  );

  const aboutRequest = loadAbout(contentDir);

  const microblogPostsRequest = loadMicroBlogArchive(
    path.join(contentDir, MICRO_BLOG_ARCHIVE_FILE)
  );

  const microPostsRequest = loadMicroPosts(
    {
      orderedEntities: data.microPosts ?? DEFAULT_ORDERED_ENTITIES,
      cacheDir,
    },
    path.join(contentDir, MICRO_POSTS_DIR)
  );

  const mastodonRequest = loadMastodonPosts({
    orderedEntities: data.mastodonPosts ?? DEFAULT_ORDERED_ENTITIES,
    cacheDir,
  });

  const statusLolRequest = loadStatusLolPosts();

  const albumRequest = loadAlbumsAndPhotos(
    data.albums ?? DEFAULT_ORDERED_ENTITIES,
    data.albumPhotos ?? DEFAULT_ORDERED_ENTITIES,
    path.join(contentDir, ALBUMS_DIR)
  );

  const faqRequest = loadFaq(contentDir);

  const nowLoader = loadNow();

  const [
    blogPostsResult,
    aboutResult,
    microBlogArchiveResult,
    microPostsResult,
    mastodonResult,
    statusLolResult,
    albumResult,
    faqResult,
    nowResult,
  ] = await Promise.all([
    blogPostsRequest,
    aboutRequest,
    microblogPostsRequest,
    microPostsRequest,
    mastodonRequest,
    statusLolRequest,
    albumRequest,
    faqRequest,
    nowLoader,
  ]);

  return Ok({
    blogPosts: blogPostsResult.ok ? blogPostsResult.value : data.blogPosts,
    about: aboutResult.ok ? aboutResult.value : data.about,
    microBlogsPosts: microBlogArchiveResult.ok
      ? microBlogArchiveResult.value
      : data.microBlogsPosts,
    microPosts: microPostsResult.ok
      ? microPostsResult.value
      : data.microPosts,
    mastodonPosts: mastodonResult.ok
      ? mastodonResult.value
      : data.mastodonPosts,
    statusLolPosts: statusLolResult.ok
      ? statusLolResult.value
      : data.statusLolPosts,
    albums: albumResult.ok ? albumResult.value.albums : data.albums,
    albumPhotos: albumResult.ok
      ? albumResult.value.albumPhotos
      : data.albumPhotos,
    faq: faqResult.ok ? faqResult.value : data.faq,
    now: nowResult.ok ? nowResult.value : data.now,
    lastUpdated: new Date().toISOString(),
  });
}
