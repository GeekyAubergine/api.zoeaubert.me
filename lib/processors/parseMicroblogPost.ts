import type {
  MastodonPostEntity, MicroBlogEntity,
  MicroPostEntity
} from "../types";
import {
  Err,
  Ok,
  Result,
  exhaust
} from "../utils";
import { ReviewForTvShowSeason, LINK_TITLE_REGEX, SEASON_REGEX, REVIEW_REGEX, SCORE_AND_MAX_REGEX } from "./processsTvShows";

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
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  return Ok({
    movieTitleAndYear: {
      title,
      year: parseInt(season, 10),
    },
    review: {
      score: parseInt(score, 10),
      review: review || null,
      date,
      postPermalink: post.permalink,
    },
  });
}
function parseMicroPostPost(
  post: MicroPostEntity
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

  const year = SEASON_REGEX.exec(titleLine)?.[1];

  const review = REVIEW_REGEX.exec(ratingAndReviewLine)?.[1];

  const scoreAndMax = SCORE_AND_MAX_REGEX.exec(ratingAndReviewLine);

  const score = scoreAndMax?.[1];

  if (!title || !year || !review || !score) {
    return Err({
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  return Ok({
    movieTitleAndYear: {
      title,
      year: parseInt(year, 10),
    },
    review: {
      score: parseInt(score, 10),
      review,
      date,
      postPermalink: post.permalink,
    },
  });
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
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  const title = titleLine.replace(SEASON_REGEX, "").trim();

  const year = SEASON_REGEX.exec(titleLine)?.[1];

  const review = REVIEW_REGEX.exec(ratingAndReviewLine)?.[1];

  const scoreAndMax = SCORE_AND_MAX_REGEX.exec(ratingAndReviewLine);

  const score = scoreAndMax?.[1];

  if (!title || !year || !score) {
    return Err({
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  return Ok({
    movieTitleAndYear: {
      title,
      year: parseInt(year, 10),
    },
    review: {
      score: parseInt(score, 10),
      review: review || null,
      date,
      postPermalink: post.permalink,
    },
  });
}

export function parseReviewPost(
  post: MicroPostEntity | MastodonPostEntity | MicroBlogEntity
): Result<ReviewForTvShowSeason[]> {
  const { type } = post;

  switch (type) {
    case "microBlog":
      return parseMicroblogPost(post);
    case "microPost":
      return parseMicroPostPost(post);
    case "mastodon":
      return parseMastodonPost(post);
    default:
      return exhaust(type);
  }
}
