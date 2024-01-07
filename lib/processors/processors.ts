import {
  Ok,
  Result,
  downloadAndCacheFile,
  getImageOrientation,
  getImageSize,
} from "../utils";
import { Data, DataImage, SourceDataImage } from "../types";
import { SourceData } from "../loaders/loaders";
import { DEFAULT_SOURCE_DATA_ABOUT } from "../loaders/aboutLoader";
import { DEFAULT_SOURCE_DATA_FAQ } from "../loaders/faqLoader";
import { processBlogPosts } from "./processBlogPosts";

export const DEFAULT_DATA: Data = {
  about: DEFAULT_SOURCE_DATA_ABOUT,
  faq: DEFAULT_SOURCE_DATA_FAQ,
  blogPosts: {},
  allImages: [],
  lastUpdated: "2000-01-01T00:00:00.000Z",
};

export async function processImage({
  sourceImage,
  cacheDir,
  parentPermalink,
  date,
}: {
  sourceImage: SourceDataImage;
  cacheDir: string;
  parentPermalink: string;
  date: string;
}): Promise<Result<DataImage>> {
  const downloadResult = await downloadAndCacheFile(sourceImage.src, cacheDir);

  if (!downloadResult.ok) {
    return downloadResult;
  }

  const cachedFilePath = downloadResult.value.cachePath;

  const size = await getImageSize(cachedFilePath);

  if (!size.ok) {
    return size;
  }

  const orientation = getImageOrientation(size.value.width, size.value.height);

  return Ok({
    src: sourceImage.src,
    alt: sourceImage.alt,
    date,
    title: sourceImage.title,
    parentPermalink,
    width: size.value.width,
    height: size.value.height,
    orientation,
  });
}

export async function processData(
  sourceData: SourceData,
  cacheDir: string
): Promise<Result<Data>> {
  let data = { ...DEFAULT_DATA };

  // Do simple copies first
  if (sourceData.about) {
    data.about = sourceData.about;
  }

  if (sourceData.faq) {
    data.faq = sourceData.faq;
  }

  // Complex

  const blogPosts = await processBlogPosts(sourceData, cacheDir);

  if (!blogPosts.ok) {
    return blogPosts;
  }

  data.blogPosts = blogPosts.value;

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
