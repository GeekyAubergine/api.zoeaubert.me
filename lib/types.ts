type EntityMedia = { url: string; alt: string };

type BaseEntity<T, D> = {
  rawDataHash: string;
  type: T;
  id: string;
  url: string;
  date: string;
} & D;

export type BlogPostEntity = BaseEntity<
  "blogPost",
  {
    title: string;
    description: string;
    content: string;
    tags: string[];
    hero: {
      url: string;
      alt: string;
      showHero: boolean;
    } | null;
    media: EntityMedia[];
  }
>;

export type StatusLolEntity = BaseEntity<
  "statuslol",
  {
    content: string;
    emoji: string;
  }
>;

export type MastodonEntity = BaseEntity<
  "mastodon",
  {
    content: string;
    tags: string[];
    media: EntityMedia[];
  }
>;

export type MicroBlogEntity = BaseEntity<
  "microblog",
  {
    content: string;
    tags: string[];
    media: EntityMedia[];
  }
>;

export type Photo = {
  id: string;
  permalink: string;
  url: string;
  description: string;
  alt: string;
  tags: string[];
  featured: boolean;
};

export type AlbumAwarePhoto = Photo & {
  albumTotalPhotos: number;
  previous: string | null;
  next: string | null;
  albumTitle: string;
  date: string;
};

export type AlbumEntity = BaseEntity<
  "album",
  {
    title: string;
    description: string | null;
    photos: Record<string, AlbumAwarePhoto>;
    photoOrder: string[];
    tags: string[];
  }
>;

export type Entity =
  | BlogPostEntity
  | StatusLolEntity
  | MastodonEntity
  | MicroBlogEntity
  | AlbumEntity;

export type OrderedEntities = {
  entities: Record<string, Entity>;
  entityOrder: string[];
};

export type Archive = OrderedEntities & {
  lastUpdated: string;
};

export type Config = {
  mastodon: {
    accountId: string;
  };
};

export type LoaderParams = {
  archive: Archive;
  config: Config;
  cacheDirectory: string;
};
