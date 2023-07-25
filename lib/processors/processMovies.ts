import type {
  Data,
  MastodonPostEntity,
  MediaReview,
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
  mergeOrderedEntities,
} from "../utils";
import config from "../../config";

export type MovieTitleAndYear = {
  title: string;
  year: number;
};

export type ReviewForMovie = {
  movieTitleAndYear: MovieTitleAndYear;
  review: MediaReview;
};

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

export function cleanMovieTitle(title: string): string {
  return title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
}

function movieKey(movie: MovieTitleAndYear): string {
  return `${cleanMovieTitle(movie.title)}-${movie.year}`;
}

function makePermalink(movie: MovieTitleAndYear) {
  return `/hobbies/movies/${movieKey(movie)}`;
}

function parseMicroblogPost(post: MicroBlogEntity): Result<ReviewForMovie> {
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

function parseMicroPostPost(post: MicroPostEntity): Result<ReviewForMovie> {
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

function parseMastodonPost(post: MastodonPostEntity): Result<ReviewForMovie> {
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
): Result<ReviewForMovie> {
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

async function findMoviePosterAndID(
  data: Data,
  movieWithTitleAndYear: MovieTitleAndYear
): Promise<
  Result<{
    posterUrl: string;
    themoviedbId: number;
  }>
> {
  const key = movieKey(movieWithTitleAndYear);

  const existing = data.movies[key];

  if (existing) {
    return Ok({
      posterUrl: existing.posterUrl,
      themoviedbId: existing.themoviedbId,
    });
  }

  const serachQuery = movieTitleToSearch(movieWithTitleAndYear.title);

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
    movie.release_date.startsWith(movieWithTitleAndYear.year.toString())
  );

  if (!movie) {
    return Err({
      type: "COULD_NOT_FIND_MOVIE",
      movie: movieWithTitleAndYear,
    });
  }

  return Ok({
    posterUrl: movie.poster_path,
    themoviedbId: movie.id,
  });
}

async function processMovieWithTitleYearAndReviews(
  data: Data,
  key: string,
  movieTitleAndYear: MovieTitleAndYear,
  reviews: MediaReview[]
): Promise<Result<Movie>> {
  const posterAndIdResult = await findMoviePosterAndID(data, movieTitleAndYear);

  if (!posterAndIdResult.ok) {
    return posterAndIdResult;
  }

  const { posterUrl, themoviedbId } = posterAndIdResult.value;

  const sortedReviews = reviews.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const movie: Movie = {
    key,
    title: movieTitleAndYear.title,
    year: movieTitleAndYear.year,
    reviews: sortedReviews,
    averageScore:
      reviews.reduce((acc, review) => acc + review.score, 0) /
      Math.max(reviews.length, 1),
    posterUrl,
    permalink: makePermalink(movieTitleAndYear),
    themoviedbId,
  };

  return Ok(movie);
}

export async function processMovies(data: Data): Promise<Result<Movies>> {
  const potentialMoviePosts = mergeOrderedEntities<
    MicroPostEntity | MastodonPostEntity | MicroBlogEntity
  >([data.microPosts, data.mastodonPosts, data.microBlogsPosts]);

  const reviewPosts = Object.values(potentialMoviePosts.entities).filter(
    (entity) => {
      return (
        entity.tags.some((tag) => tag.toLowerCase() === TAG) &&
        !entity.tags.some((tag) => tag.toLowerCase() === TAG_TO_IGNORE)
      );
    }
  );

  const reviewResults = reviewPosts.map((reviewPosts) =>
    parseReviewPost(reviewPosts)
  );

  const okReviews = filterOk(reviewResults);

  const moviesTitleYearWithReviews = okReviews.reduce<
    Record<
      string,
      {
        key: string;
        movieTitleAndYear: MovieTitleAndYear;
        reviews: MediaReview[];
      }
    >
  >((acc, review) => {
    const { movieTitleAndYear: movie } = review;

    const key = movieKey(movie);

    const existing = acc[key];

    if (!existing) {
      acc[key] = {
        key,
        movieTitleAndYear: movie,
        reviews: [],
      };
    }

    acc[key]!.reviews.push(review.review);

    return acc;
  }, {});

  const movieResults = await Promise.all(
    Object.values(moviesTitleYearWithReviews).map((movie) =>
      processMovieWithTitleYearAndReviews(
        data,
        movie.key,
        movie.movieTitleAndYear,
        movie.reviews
      )
    )
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
