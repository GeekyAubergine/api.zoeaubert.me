import type {
  Data,
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  Movie,
  Movies,
} from "../types";
import {
  Err,
  Ok,
  Result,
  exhaust,
  fetchUrl,
  filterErr,
  filterOk,
  hash,
  mergeOrderedEntities,
} from "../utils";
import config from "../../config";

const TAG = "movies";
const TAG_TO_IGNORE = "twitterarchive";
const URL = "https://api.themoviedb.org/3/search/movie";

const LINK_TITLE_REGEX = /\[(.*)\]/;
const MOVIE_YEAR_REGEX = /\((\d+)(.*\))?/;
const REVIEW_REGEX = /- (.+)$/;
const SCORE_AND_MAX_REGEX = /(\d+)\/(\d+)/;

function movieTitleToSearch(title: string): string {
  return title.replace(/[&]/g, "").replace(/\s+/g, "+").toLowerCase();
}

export type MoviePostParts = Omit<Movie, "posterUrl" | "rawDataHash">;

function parseMicroblogPost(post: MicroBlogEntity): Result<MoviePostParts> {
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

  if (!title || !year || !score || !max) {
    return Err({
      type: "UNABLE_TO_PARSE_MOVIE_POST",
      post,
    });
  }

  return Ok({
    key: `${title}-${year}`,
    title,
    year: parseInt(year, 10),
    rating: {
      score: parseInt(score, 10),
      max: parseInt(max, 10),
    },
    review: review || null,
    date,
    postPermalink: post.permalink,
  });
}

function parseMicroPostPost(post: MicroPostEntity): Result<MoviePostParts> {
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
    key: `${title}-${year}`,
    title,
    year: parseInt(year, 10),
    rating: {
      score: parseInt(score, 10),
      max: parseInt(max, 10),
    },
    review,
    date,
    postPermalink: post.permalink,
  });
}

function parseMastodonPost(post: MastodonPostEntity): Result<MoviePostParts> {
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
    key: `${title}-${year}`,
    title,
    year: parseInt(year, 10),
    rating: {
      score: parseInt(score, 10),
      max: parseInt(max, 10),
    },
    review: review || null,
    date,
    postPermalink: post.permalink,
  });
}

export function parsePost(
  post: MicroPostEntity | MastodonPostEntity | MicroBlogEntity
): Result<MoviePostParts> {
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

async function findMovieFromPost(
  post: MoviePostParts,
  rawDataHash: string
): Promise<Result<Movie>> {
  const serachQuery = movieTitleToSearch(post.title);

  const response = await fetchUrl<{
    results: {
      id: number;
      title: string;
      release_date: string;
      poster_path: string;
    }[];
  }>(`${URL}?api_key=${config.movieDB.apiKey}&query=${serachQuery}`);

  if (!response.ok) {
    return response;
  }

  const { results } = response.value;

  const movie = results.find((movie) =>
    movie.release_date.startsWith(post.year.toString())
  );

  if (!movie) {
    return Err({
      type: "COULD_NOT_FIND_MOVIE",
      post,
    });
  }

  return Ok({
    key: post.key,
    title: post.title,
    year: post.year,
    rating: post.rating,
    review: post.review,
    posterUrl: movie.poster_path,
    date: post.date,
    rawDataHash,
    postPermalink: post.postPermalink,
  });
}

async function processPost(
  post: MoviePostParts,
  data: Data
): Promise<Result<Movie>> {
  const rawDataHash = hash(post);

  const existing = data.movies[post.key];

  if (existing && existing.rawDataHash === rawDataHash) {
    return Ok(existing);
  }

  return findMovieFromPost(post, rawDataHash);
}

export async function processMovies(data: Data): Promise<Result<Movies>> {
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

  const movieParts = moviePosts.reduce<MoviePostParts[]>((acc, id) => {
    const entity = potentialMoviePosts.entities[id];

    if (!entity) {
      return acc;
    }

    const post = parsePost(entity);

    if (!post.ok) {
      return acc;
    }

    return acc.concat([post.value]);
  }, []);

  const movieResults = await Promise.all(
    Object.values(movieParts).map((movie) => processPost(movie, data))
  );

  const errors = filterErr(movieResults);

  if (errors.length) {
    errors.forEach((error) => console.error(error));
  }

  const moviesArray = filterOk(movieResults);

  const movies = moviesArray.reduce<Movies>((acc, movie) => {
    acc[movie.key] = movie;
    return acc;
  }, {});

  return Ok(movies);
}
