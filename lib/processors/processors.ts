import { Ok, Result, getImageOrientation } from "../utils";
import { DEFAULT_DATA_LEGO, Data, DataImage, SourceDataImage } from "../types";
import { SourceData } from "../loaders/loaders";
import { DEFAULT_SOURCE_DATA_ABOUT } from "../loaders/aboutLoader";
import { DEFAULT_SOURCE_DATA_FAQ } from "../loaders/faqLoader";
import { processBlogPosts } from "./processBlogPosts";
import { processMovies } from "./processMovies";

export const DEFAULT_DATA: Data = {
  about: DEFAULT_SOURCE_DATA_ABOUT,
  faq: DEFAULT_SOURCE_DATA_FAQ,
  blogPosts: {},
  mastodonPosts: {},
  microPosts: {},
  microBlogArchivePosts: {},
  lego: DEFAULT_DATA_LEGO,
  games: {},
  movies: {},
  tvShows: {},
  lastUpdated: "2000-01-01T00:00:00.000Z",
};

export async function processImage({
  sourceImage,
  parentPermalink,
  date,
}: {
  sourceImage: SourceDataImage;
  parentPermalink: string;
  date: string;
}): Promise<Result<DataImage>> {
  return Ok({
    src: sourceImage.src,
    alt: sourceImage.alt,
    date,
    parentPermalink,
    width: sourceImage.width,
    height: sourceImage.height,
    orientation: getImageOrientation(sourceImage.width, sourceImage.height),
    title: null,
  });
}

export async function processData(
  sourceData: SourceData
): Promise<Result<Data>> {
  let data = { ...DEFAULT_DATA };

  // Pass-through
  if (sourceData.about) {
    data.about = sourceData.about;
  }

  if (sourceData.faq) {
    data.faq = sourceData.faq;
  }

  // Core data

  const blogPosts = await processBlogPosts(sourceData);

  if (!blogPosts.ok) {
    return blogPosts;
  }

  data.blogPosts = blogPosts.value;

  // Generated data

  const movies = await processMovies(data);

  if (!movies.ok) {
    return movies;
  }

  data.movies = movies.value;

  // const processMoviesRequest = processMovies(data);

  // const processTyShowsRequest = processTvShows(data);

  // const [processMoviesResult, processTvShowsResult] = await Promise.all([
  //   processMoviesRequest,
  //   processTyShowsRequest,
  // ]);

  // if (processMoviesResult.ok) {
  //   data["movies"] = processMoviesResult.value;
  // }

  // if (processTvShowsResult.ok) {
  //   data["tvShows"] = processTvShowsResult.value;
  // }

  return Ok(data);
}
