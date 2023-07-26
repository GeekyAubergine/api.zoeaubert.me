import { Ok, Result } from "../utils";
import { Data } from "../types";
import { processMovies } from "./processMovies";
import { processTvShows } from "./processsTvShows";

export async function generateData(data: Data): Promise<Result<Data>> {
  const processMoviesRequest = processMovies(data);

  const processTyShowsRequest = processTvShows(data);

  const [processMoviesResult, processTvShowsResult] = await Promise.all([
    processMoviesRequest,
    processTyShowsRequest,
  ]);

  if (processMoviesResult.ok) {
    data["movies"] = processMoviesResult.value;
  }

  if (processTvShowsResult.ok) {
    data["tvShows"] = processTvShowsResult.value;
  }

  return Ok(data);
}
