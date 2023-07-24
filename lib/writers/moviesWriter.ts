import natsort from "natsort";
import type { Data } from "../types";
import { Result, writeJSONFile } from "../utils";
import path from "path";

export async function writeMovies(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "movies.json");

  const { movies } = data;

  const moviesByWatchDate = Object.keys(movies).sort((a, b) => {
    const aDate = new Date(movies[a]!.date);
    const bDate = new Date(movies[b]!.date);

    return bDate.getTime() - aDate.getTime();
  });

  const moviesByName = Object.keys(movies).sort((a, b) => {
    const aTitle = movies[a]!.title.toLowerCase();
    const bTitle = movies[b]!.title.toLowerCase();

    return natsort()(aTitle, bTitle);
  });

  const out = {
    movies,
    moviesByWatchDate,
    moviesByName,
  };

  return writeJSONFile(outputPath, out);
}
