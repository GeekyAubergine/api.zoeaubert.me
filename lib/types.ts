import { SourceDataAbout } from "./loaders/aboutLoader";
import { SourceDataFaq } from "./loaders/faqLoader";

type EntityType =
  | "media"
  | "blogPost"
  | "microBlog"
  | "microPost"
  | "mastodon"
  | "statusLol"
  | "album"
  | "albumPhoto";

export type ImageOrientation = "landscape" | "portrait" | "square";

export type SourceDataImage = {
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
  orientation: ImageOrientation;
};

export type EntityMedia = {
  image: SourceDataImage;
  parentPermalink: string;
  date: string;
};

type EntityBase<T extends EntityType, D> = {
  rawDataHash: string;
  type: T;
  key: string;
  permalink: string;
  date: string;
  content: string;
  tags: string[];
  media: EntityMedia[];
  description: string;
} & D;

export type BlogPostEntity = EntityBase<
  "blogPost",
  {
    title: string;
    hero: SourceDataImage | null;
    showHero: boolean;
    firstLine: string;
  }
>;

export type MicroBlogEntity = EntityBase<"microBlog", {}>;

export type MicroPostEntity = EntityBase<"microPost", {}>;

export type MastodonPostEntity = EntityBase<
  "mastodon",
  {
    originalUrl: string;
  }
>;

export type StatusLolEntity = EntityBase<
  "statusLol",
  {
    emoji: string;
    originalUrl: string;
  }
>;

export type AlbumPhotoEntity = EntityBase<
  "albumPhoto",
  {
    fullSize: SourceDataImage;
    thumbnailSmall: SourceDataImage;
    thumbnailLarge: SourceDataImage;
    albumPermalink: string;
    albumTotalPhotos: number;
    indexString: string;
    previous: string | null;
    next: string | null;
    albumTitle: string;
    featured: boolean;
  }
>;

export type AlbumEntity = EntityBase<
  "album",
  {
    title: string;
    photoOrder: string[];
    coverPhotos: string[];
  }
>;

export type Entity =
  | BlogPostEntity
  | MicroBlogEntity
  | MicroPostEntity
  | MastodonPostEntity
  | StatusLolEntity
  | AlbumEntity
  | AlbumPhotoEntity;

export type OrderedEntities<E extends Entity> = {
  entityOrder: string[];
  entities: Record<string, E>;
};

export type BlogPosts = OrderedEntities<BlogPostEntity>;
export type MicroBlogPosts = OrderedEntities<MicroBlogEntity>;
export type MicroPosts = OrderedEntities<MicroPostEntity>;
export type MastodonPosts = OrderedEntities<MastodonPostEntity>;
export type StatusLolPosts = OrderedEntities<StatusLolEntity>;
export type Albums = OrderedEntities<AlbumEntity>;
export type AlbumPhotos = OrderedEntities<AlbumPhotoEntity>;

export type LegoSet = {
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

export type Lego = Record<string, LegoSet>;

export type Game = {
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

export type Games = Record<string, Game>;

export type LoaderData = {
  blogPosts: BlogPosts;
  microBlogsPosts: MicroBlogPosts;
  microPosts: MicroPosts;
  mastodonPosts: MastodonPosts;
  statusLolPosts: StatusLolPosts;
  albums: Albums;
  albumPhotos: AlbumPhotos;
  about: string;
  faq: string;
  now: string;
  lego: Lego;
  games: Games;
};

export type MediaReview = {
  score: number;
  review: string | null;
  postPermalink: string;
  date: string;
};

export type Movie = {
  key: string;
  title: string;
  year: number;
  reviews: MediaReview[];
  averageScore: number;
  posterUrl: string;
  permalink: string;
  themoviedbId: number;
};

export type Movies = Record<string, Movie>;

export type TvShowSeason = {
  season: number;
  reviews: MediaReview[];
  postPermalink: string;
  averageScore: number;
}

export type TvShow = {
  key: string;
  title: string;
  seasons: TvShowSeason[];
  permalink: string;
  averageScore: number;
  posterUrl: string;
  themoviedbId: number;
};

export type TvShows = Record<string, TvShow>;

export type AboutData = SourceDataAbout
export type FaqData = SourceDataFaq;

export type Data = {
  about: SourceDataAbout;
  faq: SourceDataFaq;
  lastUpdated: string;
};
