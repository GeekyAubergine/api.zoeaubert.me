import natsort from "natsort";
import type { Data, TvShow, TvShowSeason } from "../types";
import { Result, writeJSONFile } from "../utils";
import path from "path";

function seasonMostRecentReviewDate(season: TvShowSeason): string {
  const reviews = season.reviews;

  const sortedReviews = reviews.sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);

    return bDate.getTime() - aDate.getTime();
  });

  return sortedReviews[0]!.date;
}

function tvShowMostRecentReviewDate(tvShow: TvShow): string {
  const seasons = tvShow.seasons;

  const sortedSeasons = seasons.sort((a, b) => {
    const aDate = new Date(seasonMostRecentReviewDate(a));
    const bDate = new Date(seasonMostRecentReviewDate(b));

    return bDate.getTime() - aDate.getTime();
  });

  return seasonMostRecentReviewDate(sortedSeasons[0]!);
}

export async function writeTv(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "tv.json");

  const { tvShows } = data;

  const tvShowsByWatchDate = Object.keys(tvShows).sort((a, b) => {
    const aDate = new Date(tvShowMostRecentReviewDate(tvShows[a]!));
    const bDate = new Date(tvShowMostRecentReviewDate(tvShows[b]!));

    return bDate.getTime() - aDate.getTime();
  });

  const tvShowsByName = Object.keys(tvShows).sort((a, b) => {
    const aTitle = tvShows[a]!.title.toLowerCase();
    const bTitle = tvShows[b]!.title.toLowerCase();

    return natsort()(aTitle, bTitle);
  });

  const out = {
    tvShows,
    tvShowsByWatchDate,
    tvShowsByName,
  };

  return writeJSONFile(outputPath, out);
}
