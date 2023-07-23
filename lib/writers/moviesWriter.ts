import Data, {
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
} from "../types";
import {
  Err,
  Ok,
  Result,
  exhaust,
  fetchUrl,
  mergeOrderedEntities,
  writeJSONFile,
} from "../utils";
import config from "../../config";
import path from "path";

const TAG = "movies";
const TAG_TO_IGNORE = "twitterarchive";
const URL = "https://api.themoviedb.org/3/search/movie";

const LINK_TITLE_REGEX = /\[(.*)\]/;
const MOVIE_YEAR_REGEX = /\((\d+)(.*\))?/;
const REVIEW_REGEX = /- (.+)$/;
const SCORE_AND_MAX_REGEX = /(\d+)\/(\d+)/;

type Movie = {
  title: string;
  year: number;
  rating: {
    score: number;
    max: number;
  };
  review: string | null;
  posterUrl: string;
  date: string;
};

type Movies = Record<string, Movie>;

export type PostParts = Omit<Movie, "posterUrl">;

function parseMicroblogPost(post: MicroBlogEntity): Result<PostParts> {
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

  const year = MOVIE_YEAR_REGEX.exec(titleLine)?.[1];

  const review = REVIEW_REGEX.exec(ratingAndReviewLine)?.[1];

  const scoreAndMax = SCORE_AND_MAX_REGEX.exec(ratingAndReviewLine);

  const score = scoreAndMax?.[1];

  const max = scoreAndMax?.[2];

  console.log({ title, year, review, score, max });

  if (!title || !year || !score || !max) {
    return Err({
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  return Ok({
    title,
    year: parseInt(year, 10),
    rating: {
      score: parseInt(score, 10),
      max: parseInt(max, 10),
    },
    review: review || null,
    date,
  });
}

function parseMicroPostPost(post: MicroPostEntity): Result<PostParts> {
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

  const year = MOVIE_YEAR_REGEX.exec(titleLine)?.[1];

  const review = REVIEW_REGEX.exec(ratingAndReviewLine)?.[1];

  const scoreAndMax = SCORE_AND_MAX_REGEX.exec(ratingAndReviewLine);

  const score = scoreAndMax?.[1];

  const max = scoreAndMax?.[2];

  if (!title || !year || !review || !score || !max) {
    return Err({
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  return Ok({
    title,
    year: parseInt(year, 10),
    rating: {
      score: parseInt(score, 10),
      max: parseInt(max, 10),
    },
    review,
    date,
  });
}

function parseMastodonPost(post: MastodonPostEntity): Result<PostParts> {
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

  const title = titleLine.replace(MOVIE_YEAR_REGEX, "").trim();

  const year = MOVIE_YEAR_REGEX.exec(titleLine)?.[1];

  const review = REVIEW_REGEX.exec(ratingAndReviewLine)?.[1];

  const scoreAndMax = SCORE_AND_MAX_REGEX.exec(ratingAndReviewLine);

  const score = scoreAndMax?.[1];

  const max = scoreAndMax?.[2];

  if (!title || !year || !score || !max) {
    return Err({
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  return Ok({
    title,
    year: parseInt(year, 10),
    rating: {
      score: parseInt(score, 10),
      max: parseInt(max, 10),
    },
    review: review || null,
    date,
  });
}

export function parsePost(
  post: MicroPostEntity | MastodonPostEntity | MicroBlogEntity
): Result<PostParts> {
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

// async function findMoveFromPost(post: PostParts): Promise<Result<Movie>> {

// }

export async function writeMovies(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "movies.json");

  const potentialMoviePosts = mergeOrderedEntities<
    MicroPostEntity | MastodonPostEntity | MicroBlogEntity
  >([data.microPosts, data.mastodonPosts, data.microBlogsPosts]);

  const moviePosts = potentialMoviePosts.entityOrder.filter((id) => {
    const entity = potentialMoviePosts.entities[id];

    if (!entity) {
      return false;
    }

    return (
      entity.tags.some((tag) => tag.toLowerCase() === TAG) &&
      !entity.tags.some((tag) => tag.toLowerCase() === TAG_TO_IGNORE)
    );
  });

  const movies = moviePosts.reduce<Movies>((acc, id) => {
    const entity = potentialMoviePosts.entities[id];

    if (!entity) {
      return acc;
    }

    const post = parsePost(entity);

    if (!post.ok) {
      console.error(post.error);
      return acc;
    }

    return acc;
  }, {});

  const test = await fetchUrl<any>(
    `${URL}?api_key=${config.movieDB.apiKey}&query=the+avengers`
  );

  console.log({ test });

  return writeJSONFile(outputPath, movies);
}
