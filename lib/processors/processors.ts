import { Ok, Result } from "../utils";
import { Data } from "../types";
import { processMovies } from "./processsMovies";

export async function generateData(data: Data): Promise<Result<Data>> {
  const processMoviesResult = await processMovies(data);

  if (processMoviesResult.ok) {
    data["movies"] = processMoviesResult.value;
  }

  return Ok(data);
}
