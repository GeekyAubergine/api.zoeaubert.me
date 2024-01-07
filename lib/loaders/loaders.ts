import path from "path";
import { Ok, Result } from "../utils";
import {
  DEFAULT_SOURCE_DATA_ABOUT,
  SourceDatadAbout as SourceDataAbout,
  loadAbout,
} from "./aboutLoader";
import {
  DEFAULT_SOURCE_DATA_BLOG_POSTS,
  SourceDataBlogPosts,
  loadBlogPosts,
} from "./blogPostLoader";
import {
  DEFAULT_SOURCE_DATA_MICRO_BLOG_ARCHIVE_POSTS,
  SourceDataMicroBlogArchivePosts,
  loadMicroBlogArchive,
} from "./microBlogArchiveLoader";
import {
  DEFAULT_SOURCE_DATA_MICRO_POSTS,
  SourceDataMicroPosts,
  loadMicroPosts,
} from "./microsLoader";
import {
  DEFAULT_SOURCE_DATA_STATUS_LOL,
  SourceDataStatusLol,
  loadStatusLolPosts,
} from "./statuslolLoader";
import {
  DEFAULT_SOURCE_DATA_FAQ,
  SourceDataFaq as SourceDataFaq,
  loadFaq,
} from "./faqLoader";
import { DEFAULT_SOURCE_DATA_NOW, SourceDataNow, loadNow } from "./nowLoader";
import {
  DEFAULT_SOURCE_DATA_LEGO,
  SourceDataLego,
  loadLegoSets,
} from "./legoLoader";
import {
  DEFAULT_SOURCE_DATA_GAMES,
  SourceDataGames as SourceDataGames,
  loadGames,
} from "./gamesLoader";
import { logFailedPromisedResults } from "../loggger";

const POSTS_DIR = "blogPosts";
const MICRO_BLOG_ARCHIVE_FILE = "microBlog/feed.json";
const MICRO_POSTS_DIR = "micros";
const ALBUMS_DIR = "albums";

const DEFAULT_ORDERED_ENTITIES = {
  entityOrder: [],
  entities: {},
};

export type SourceData = {
  about?: SourceDataAbout;
  faq?: SourceDataFaq;
  games?: SourceDataGames;
  lego?: SourceDataLego;
  statusLol?: SourceDataStatusLol;
  now?: SourceDataNow;
  microPosts?: SourceDataMicroPosts;
  blogPosts?: SourceDataBlogPosts;
  microBlogArchivePosts?: SourceDataMicroBlogArchivePosts;
  lastUpdated?: string;
};

export const DEFAULT_SOURCE_DATA: SourceData = {
  about: DEFAULT_SOURCE_DATA_ABOUT,
  faq: DEFAULT_SOURCE_DATA_FAQ,
  games: DEFAULT_SOURCE_DATA_GAMES,
  lego: DEFAULT_SOURCE_DATA_LEGO,
  statusLol: DEFAULT_SOURCE_DATA_STATUS_LOL,
  now: DEFAULT_SOURCE_DATA_NOW,
  microPosts: DEFAULT_SOURCE_DATA_MICRO_POSTS,
  blogPosts: DEFAULT_SOURCE_DATA_BLOG_POSTS,
  microBlogArchivePosts: DEFAULT_SOURCE_DATA_MICRO_BLOG_ARCHIVE_POSTS,
  lastUpdated: "2000-01-01T00:00:00.000Z",
};

export type LoaderParams<D> = {
  data: D;
  cacheDir: string;
};

export async function loadSourceData(
  previousData: SourceData,
  cacheDir: string,
  contentDir: string
): Promise<Result<SourceData>> {
  const data = { ...previousData };

  const aboutRequest = loadAbout(contentDir);
  const faqRequest = loadFaq(contentDir);
  const gamesRequest = loadGames(
    previousData.games ?? DEFAULT_SOURCE_DATA_GAMES
  );
  const legoRequest = loadLegoSets(
    previousData.lego ?? DEFAULT_SOURCE_DATA_LEGO
  );
  const statusLolRequest = loadStatusLolPosts(
    previousData.statusLol ?? DEFAULT_SOURCE_DATA_STATUS_LOL
  );
  const nowRequest = loadNow();
  const microPostsRequest = loadMicroPosts(
    previousData.microPosts ?? DEFAULT_SOURCE_DATA_MICRO_POSTS,
    MICRO_POSTS_DIR
  );
  const blogPostsRequest = loadBlogPosts(
    previousData.blogPosts ?? DEFAULT_SOURCE_DATA_BLOG_POSTS,
    path.join(contentDir, POSTS_DIR)
  );
  const microBlogArchiveRequest = loadMicroBlogArchive(
    path.join(contentDir, MICRO_BLOG_ARCHIVE_FILE)
  );

  const [
    aboutResult,
    faqResult,
    gamesResult,
    legoResult,
    statusLolResult,
    nowResult,
    microPostsResult,
    blogPostsResult,
    microBlogArchiveResult,
  ] = await Promise.allSettled([
    aboutRequest,
    faqRequest,
    gamesRequest,
    legoRequest,
    statusLolRequest,
    nowRequest,
    microPostsRequest,
    blogPostsRequest,
    microBlogArchiveRequest,
  ]);

  if (aboutResult.status === "fulfilled" && aboutResult.value.ok) {
    data.about = aboutResult.value.value;
  }

  if (faqResult.status === "fulfilled" && faqResult.value.ok) {
    data.faq = faqResult.value.value;
  }

  if (gamesResult.status === "fulfilled" && gamesResult.value.ok) {
    data.games = gamesResult.value.value;
  }

  if (legoResult.status === "fulfilled" && legoResult.value.ok) {
    data.lego = legoResult.value.value;
  }

  if (statusLolResult.status === "fulfilled" && statusLolResult.value.ok) {
    data.statusLol = statusLolResult.value.value;
  }

  if (nowResult.status === "fulfilled" && nowResult.value.ok) {
    data.now = nowResult.value.value;
  }

  if (microPostsResult.status === "fulfilled" && microPostsResult.value.ok) {
    data.microPosts = microPostsResult.value.value;
  }

  if (blogPostsResult.status === "fulfilled" && blogPostsResult.value.ok) {
    data.blogPosts = blogPostsResult.value.value;
  }

  if (
    microBlogArchiveResult.status === "fulfilled" &&
    microBlogArchiveResult.value.ok
  ) {
    data.microBlogArchivePosts = microBlogArchiveResult.value.value;
  }

  data.lastUpdated = new Date().toISOString();

  logFailedPromisedResults([
    aboutResult,
    faqResult,
    gamesResult,
    legoResult,
    statusLolResult,
    nowResult,
    microPostsResult,
    blogPostsResult,
    microBlogArchiveResult,
  ]);

  return Ok(data);

  // return Ok({
  //   mastodonPosts: mastodonResult.ok
  //     ? mastodonResult.value
  //     : data.mastodonPosts,
  //   albums: albumResult.ok ? albumResult.value.albums : data.albums,
  //   albumPhotos: albumResult.ok
  //     ? albumResult.value.albumPhotos
  //     : data.albumPhotos,
  // });
}

// export async function loadData(
//   data: LoaderData,
//   cacheDir: string,
//   contentDir: string
// ): Promise<Result<SourceData>> {
//   const blogPostsRequest = loadBlogPosts(
//     {
//       orderedEntities: data.blogPosts ?? DEFAULT_ORDERED_ENTITIES,
//       cacheDir,
//     },
//     path.join(contentDir, POSTS_DIR)
//   );

//   const aboutRequest = loadAbout(contentDir);

//   const microblogPostsRequest = loadMicroBlogArchive(
//     path.join(contentDir, MICRO_BLOG_ARCHIVE_FILE)
//   );

//   const microPostsRequest = loadMicroPosts(
//     {
//       orderedEntities: data.microPosts ?? DEFAULT_ORDERED_ENTITIES,
//       cacheDir,
//     },
//     path.join(contentDir, MICRO_POSTS_DIR)
//   );

//   const mastodonRequest = loadMastodonPosts({
//     orderedEntities: data.mastodonPosts ?? DEFAULT_ORDERED_ENTITIES,
//     cacheDir,
//   });

//   const statusLolRequest = loadStatusLolPosts();

//   const albumRequest = loadAlbumsAndPhotos(
//     data.albums ?? DEFAULT_ORDERED_ENTITIES,
//     data.albumPhotos ?? DEFAULT_ORDERED_ENTITIES,
//     path.join(contentDir, ALBUMS_DIR)
//   );

//   const faqRequest = loadFaq(contentDir);

//   const nowRequest = loadNow();

//   const legoSetsRequest = loadLegoSets();

//   const gamesRequest = loadGames();

//   const [
//     blogPostsResult,
//     aboutResult,
//     microBlogArchiveResult,
//     microPostsResult,
//     mastodonResult,
//     statusLolResult,
//     albumResult,
//     faqResult,
//     nowResult,
//     legoSetsResult,
//     gamesResult,
//   ] = await Promise.all([
//     blogPostsRequest,
//     aboutRequest,
//     microblogPostsRequest,
//     microPostsRequest,
//     mastodonRequest,
//     statusLolRequest,
//     albumRequest,
//     faqRequest,
//     nowRequest,
//     legoSetsRequest,
//     gamesRequest,
//   ]);

//   return Ok({
//     blogPosts: blogPostsResult.ok ? blogPostsResult.value : data.blogPosts,
//     about: aboutResult.ok ? aboutResult.value : data.about,
//     microBlogsPosts: microBlogArchiveResult.ok
//       ? microBlogArchiveResult.value
//       : data.microBlogsPosts,
//     microPosts: microPostsResult.ok ? microPostsResult.value : data.microPosts,
//     mastodonPosts: mastodonResult.ok
//       ? mastodonResult.value
//       : data.mastodonPosts,
//     statusLolPosts: statusLolResult.ok
//       ? statusLolResult.value
//       : data.statusLolPosts,
//     albums: albumResult.ok ? albumResult.value.albums : data.albums,
//     albumPhotos: albumResult.ok
//       ? albumResult.value.albumPhotos
//       : data.albumPhotos,
//     faq: faqResult.ok ? faqResult.value : data.faq,
//     now: nowResult.ok ? nowResult.value : data.now,
//     lego: legoSetsResult.ok ? legoSetsResult.value : data.lego,
//     games: gamesResult.ok ? gamesResult.value : data.games,
//     lastUpdated: new Date().toISOString(),
//   });
// }
