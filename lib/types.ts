import { SourceDataAbout } from "./loaders/aboutLoader";
import { SourceDataFaq } from "./loaders/faqLoader";

export type ImageOrientation = "landscape" | "portrait" | "square";

export type SourceDataImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  orientation: ImageOrientation;
};

export type DataImage = {
  src: string;
  alt: string;
  date: string;
  title: string | null;
  parentPermalink: string;
};

export type DataAbout = SourceDataAbout;
export type DataFaq = SourceDataFaq;

export type DataBlogPost = {
  key: string;
  permalink: string;
  title: string;
  date: string;
  description: string;
  content: string;
  tags: string[];
  hero: DataImage | null;
  images: DataImage[];
};

export type DataBlogPosts = Record<string, DataBlogPost>;

export type DataMastodonPost = {
  key: string;
  permalink: string;
  date: string;
  content: string;
  tags: string[];
  originalUrl: string;
  images: DataImage[];
};

export type DataMastodonPosts = Record<string, DataMastodonPost>;

export type DataMicroPost = {
  key: string;
  date: string;
  content: string;
  tags: string[];
  images: DataImage[];
  permalink: string;
}

export type DataMicroPosts = Record<string, DataMicroPost>;

export type DataMicroBlogArchivePost = {
  key: string;
  date: string;
  content: string;
  description: string;
  tags: string[];
  images: DataImage[];
  permalink: string;
};

export type DataMicroBlogArchivePosts = Record<
  string,
  DataMicroBlogArchivePost
>;

export type DataMediaReview = {
  score: number;
  review: string | null;
  postPermalink: string;
  date: string;
};

export type DataMovie = {
  key: string;
  title: string;
  year: number;
  reviews: DataMediaReview[];
  averageScore: number;
  posterUrl: string;
  permalink: string;
  themoviedbId: number;
};

export type DataMovies = Record<string, DataMovie>;

export type DataTvShowSeason = {
  season: number;
  reviews: DataMediaReview[];
  postPermalink: string;
  averageScore: number;
};

export type DataTvShow = {
  key: string;
  title: string;
  seasons: DataTvShowSeason[];
  permalink: string;
  averageScore: number;
  posterUrl: string;
  themoviedbId: number;
};

export type DataTvShows = Record<string, DataTvShow>;

export type DataLegoSet = {
  key: string;
  name: string;
  number: string;
  pieces: number;
  image: {
    src: string;
  };
  thumbnail: {
    src: string;
  };
  bricksetUrl: string;
  quantity: number;
};

export type DataLego = { sets: Record<string, DataLegoSet> };

export const DEFAULT_DATA_LEGO: DataLego = {
  sets: {},
};

export type DataGame = {
  appid: number;
  name: string;
  played: boolean;
  playtime: {
    minutes: number;
    hours: number;
  };
  lastPlayed: {
    date: string;
    timestamp: number;
  };
  link: string;
  headerImage: {
    src: string;
  };
};

export type DataGames = Record<string, DataGame>;

export type Data = {
  about: SourceDataAbout;
  faq: SourceDataFaq;
  blogPosts: DataBlogPosts;
  mastodonPosts: DataMastodonPosts;
  microPosts: DataMicroPosts;
  microBlogArchivePosts: DataMicroBlogArchivePosts;
  lego: DataLego;
  games: DataGames;
  movies: DataMovies;
  tvShows: DataTvShows;
  lastUpdated: string;
};
