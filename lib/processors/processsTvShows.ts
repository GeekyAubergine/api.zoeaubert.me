import type {
  Data,
  MastodonPostEntity,
  MediaReview,
  MicroBlogEntity,
  TvShow,
  TvShowSeason,
  TvShows,
} from "../types";
import {
  Err,
  Ok,
  Result,
  exhaust,
  fetchUrl,
  filterErr,
  filterOk,
  mergeOrderedEntities,
} from "../utils";
import config from "../../config";

export type ReviewForTvShowSeason = {
  tvShowTitle: string;
  seasonNumber: number;
  review: MediaReview;
};

type TvShowSeasonWithoutAverageScore = Omit<TvShowSeason, "averageScore"> & {
  tvShowTitle: string;
};

const TAG = "tv";
const URL = "https://api.themoviedb.org/3/search/tv";

export const LINK_TITLE_REGEX = /\[(.*)\]/;
export const SEASON_REGEX = /\((S.*)\)/;
export const REVIEW_REGEX = /- (.+)$/;
export const SCORE_AND_MAX_REGEX = /(\d+)\/(\d+)/;

const SIMPLE_SEASON_NUMBER_REGEX = /\(S(\d+)\)/;
const NUMBERS_REGEX = /\d+/g;

function tvShowTitleToSearch(title: string): string {
  return title.replace(/[&]/g, "").replace(/\s+/g, "+").toLowerCase();
}

export function cleanTvShowTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function tvShowKey(tvShowTitle: string): string {
  return `${cleanTvShowTitle(tvShowTitle)}`;
}

function makePermalink(tvShowTitle: string) {
  return `/hobbies/tv/${tvShowKey(tvShowTitle)}`;
}

function parseSimpleSeasonNumber(content: string): number | null {
  const match = content.match(SIMPLE_SEASON_NUMBER_REGEX);

  if (!match) {
    return null;
  }

  const [, season] = match;

  if (!season) {
    return null;
  }

  const seasonNumber = parseInt(season, 10);

  if (isNaN(seasonNumber)) {
    return null;
  }

  return seasonNumber;
}

export function parseSeasonNumbers(seasons: string): Result<number[]> {
  const simpleSeasonNumber = parseSimpleSeasonNumber(seasons);

  if (simpleSeasonNumber) {
    return Ok([simpleSeasonNumber]);
  }

  const numbers = seasons.match(NUMBERS_REGEX);

  if (!numbers) {
    return Err({
      type: "COULD_NOT_PARSE_SEASON",
      season: seasons,
    });
  }

  const seasonNumbers = numbers.map((number) => parseInt(number, 10));

  return Ok(seasonNumbers);
}

function parseMicroblogPost(
  post: MicroBlogEntity
): Result<ReviewForTvShowSeason[]> {
  const { content, date } = post;

  const lines = content.split("\n").filter((line) => line.trim() !== "");

  const [titleLine, ratingAndReviewLine] = lines;

  if (!titleLine || !ratingAndReviewLine) {
    return Err({
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  const title = LINK_TITLE_REGEX.exec(titleLine)?.[1];

  const season = SEASON_REGEX.exec(titleLine)?.[1];

  const review = REVIEW_REGEX.exec(ratingAndReviewLine)?.[1];

  const scoreAndMax = SCORE_AND_MAX_REGEX.exec(ratingAndReviewLine);

  const score = scoreAndMax?.[1];

  if (!title || !season || !score) {
    return Err({
      type: "UNABLE_TO_PARSE_TV_SHOW_POST",
      post,
    });
  }

  const seasons = parseSeasonNumbers(season);

  if (!seasons.ok) {
    return seasons;
  }

  const reviews: ReviewForTvShowSeason[] = seasons.value.map((seasonNumber) => {
    return {
      tvShowTitle: title,
      seasonNumber,
      review: {
        score: parseInt(score, 10),
        review: review || null,
        date,
        postPermalink: post.permalink,
      },
    };
  });

  return Ok(reviews);
}

function parseMastodonPost(
  post: MastodonPostEntity
): Result<ReviewForTvShowSeason[]> {
  const { content, date } = post;

  const lines = content
    .split("</p>")
    .map((line) => line.replace(/<\/?p>/g, "").trim())
    .filter((line) => line.trim() !== "");

  const [titleLine, ratingAndReviewLine] = lines;

  if (!titleLine || !ratingAndReviewLine) {
    return Err({
      type: "UNABLE_TO_PARSE_TV_SHOW_POST",
      post,
    });
  }

  const title = titleLine.replace(SEASON_REGEX, "").trim();

  const season = SEASON_REGEX.exec(titleLine)?.[1];

  const review = REVIEW_REGEX.exec(ratingAndReviewLine)?.[1];

  const scoreAndMax = SCORE_AND_MAX_REGEX.exec(ratingAndReviewLine);

  const score = scoreAndMax?.[1];

  if (!title || !season || !score) {
    return Err({
      type: "UNABLE_TO_PARSE_TV_SHOW_POST",
      post,
    });
  }

  const seasons = parseSeasonNumbers(season);

  if (!seasons.ok) {
    return seasons;
  }

  const reviews: ReviewForTvShowSeason[] = seasons.value.map((seasonNumber) => {
    return {
      tvShowTitle: title,
      seasonNumber,
      review: {
        score: parseInt(score, 10),
        review: review || null,
        date,
        postPermalink: post.permalink,
      },
    };
  });

  return Ok(reviews);
}

export function parseReviewPost(
  post: MicroBlogEntity | MastodonPostEntity
): Result<ReviewForTvShowSeason[]> {
  const { type } = post;

  switch (type) {
    case "microBlog":
      return parseMicroblogPost(post);
    case "mastodon":
      return parseMastodonPost(post);
    default:
      return exhaust(type);
  }
}

async function findMoviePosterAndID(
  data: Data,
  tvShowTitle: string
): Promise<
  Result<{
    posterUrl: string;
    themoviedbId: number;
  }>
> {
  const key = tvShowKey(tvShowTitle);

  const existing = data.movies[key];

  if (existing) {
    return Ok({
      posterUrl: existing.posterUrl,
      themoviedbId: existing.themoviedbId,
    });
  }

  const serachQuery = tvShowTitleToSearch(tvShowTitle);

  const response = await fetchUrl<{
    results: {
      id: number;
      original_name: string;
      release_date: string;
      poster_path: string;
    }[];
  }>(`${URL}?api_key=${config.movieDB.apiKey}&query=${serachQuery}`);

  if (!response.ok) {
    return response;
  }

  const { results } = response.value;

  const movie = results.find((movie) =>
    movie.original_name.toLowerCase().includes(tvShowTitle.toLowerCase())
  );

  if (!movie) {
    return Err({
      type: "COULD_NOT_FIND_TV_SHOW_BY_TITLE",
      title: tvShowTitle,
    });
  }

  return Ok({
    posterUrl: movie.poster_path,
    themoviedbId: movie.id,
  });
}

function processTvShowSeason(
  tvShowSeason: TvShowSeasonWithoutAverageScore
): TvShowSeason {
  const { reviews } = tvShowSeason;

  const averageScore = Math.floor(
    reviews.reduce((acc, review) => acc + review.score, 0) / reviews.length
  );

  const sortedReviews = reviews.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return {
    ...tvShowSeason,
    averageScore,
    reviews: sortedReviews,
  };
}

async function processTvShowWithSeasons(
  data: Data,
  seasons: TvShowSeasonWithoutAverageScore[]
): Promise<Result<TvShow>> {
  const firstSeason = seasons[0];

  if (!firstSeason) {
    return Err({
      type: "COULD_NOT_FIND_TV_SHOW_FROM_EMPTY_SEASONS",
    });
  }

  const { tvShowTitle } = firstSeason;

  const posterAndId = await findMoviePosterAndID(data, tvShowTitle);

  if (!posterAndId.ok) {
    return posterAndId;
  }

  const unsortedSeasons = seasons.map(processTvShowSeason);

  const sortedSeasons = unsortedSeasons.sort((a, b) => {
    return b.season - a.season;
  });

  const totalReviews = sortedSeasons.reduce(
    (acc, season) => acc + season.reviews.length,
    0
  );

  const averageScore = Math.floor(
    sortedSeasons.reduce((acc, season) => {
      return (
        acc + season.reviews.reduce((acc, review) => acc + review.score, 0)
      );
    }, 0) / totalReviews
  );

  const key = tvShowKey(tvShowTitle);

  const tvShow: TvShow = {
    key,
    title: tvShowTitle,
    seasons: sortedSeasons,
    averageScore,
    permalink: makePermalink(tvShowTitle),
    posterUrl: posterAndId.value.posterUrl,
    themoviedbId: posterAndId.value.themoviedbId,
  };

  return Ok(tvShow);
}

export async function processTvShows(data: Data): Promise<Result<TvShows>> {
  const potentialTvPosts = mergeOrderedEntities<
    MastodonPostEntity | MicroBlogEntity
  >([data.mastodonPosts, data.microBlogsPosts]);

  const reviewPosts = Object.values(potentialTvPosts.entities).filter(
    (entity) => {
      return entity.tags.some((tag) => tag.toLowerCase() === TAG);
    }
  );

  const reviewResults = reviewPosts.map((reviewPosts) =>
    parseReviewPost(reviewPosts)
  );

  const okReviews = filterOk(reviewResults).flat();

  const tvShowGrouped = okReviews.reduce<
    Record<string, TvShowSeasonWithoutAverageScore[]>
  >((acc, review) => {
    const { tvShowTitle, seasonNumber } = review;

    const key = tvShowKey(tvShowTitle);

    if (!acc[key]) {
      acc[key] = [];
    }

    const existingShow = acc[key]!;

    const existingSeason = existingShow.find(
      (season) => season.season === seasonNumber
    );

    if (!existingSeason) {
      existingShow.push({
        season: seasonNumber,
        reviews: [review.review],
        postPermalink: review.review.postPermalink,
        tvShowTitle,
      });
    } else {
      existingSeason.reviews.push(review.review);
    }

    return acc;
  }, {});

  const tvShowResults = await Promise.all(
    Object.values(tvShowGrouped).map((seasons) =>
      processTvShowWithSeasons(data, seasons)
    )
  );

  const errors = filterErr(tvShowResults);

  if (errors.length) {
    errors.forEach((error) => console.error(error));
  }

  const tvShowsArray = filterOk(tvShowResults);

  const tvShows = tvShowsArray.reduce<TvShows>((acc, tvShow) => {
    acc[tvShow.key] = tvShow;
    return acc;
  }, {});

  return Ok(tvShows);
}
