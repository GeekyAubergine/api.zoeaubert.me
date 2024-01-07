import { Ok, Result } from "../utils";
import { Data } from "../types";
import { SourceData } from "lib/loaders/loaders";
import { DEFAULT_SOURCE_DATA_ABOUT } from "lib/loaders/aboutLoader";
import { DEFAULT_SOURCE_DATA_FAQ } from "lib/loaders/faqLoader";

export const DEFAULT_DATA: Data = {
  about: DEFAULT_SOURCE_DATA_ABOUT,
  faq: DEFAULT_SOURCE_DATA_FAQ,
  lastUpdated: "2000-01-01T00:00:00.000Z",
};

export async function processData(sourceData: SourceData): Promise<Result<Data>> {
  let data = { ...DEFAULT_DATA };

  // Do simple copies first
  if (sourceData.about) {
    data.about = sourceData.about;
  }

  if (sourceData.lastUpdated) {
    data.lastUpdated = sourceData.lastUpdated;
  }

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
