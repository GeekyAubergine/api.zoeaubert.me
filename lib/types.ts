type EntityMedia = { url: string; alt: string };

type BaseEntity<T, D> = {
  rawDataHash: string;
  type: T;
  id: string;
  slug: string;
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
    originalUrl: string;
  }
>;

export type MastodonEntity = BaseEntity<
  "mastodon",
  {
    content: string;
    tags: string[];
    media: EntityMedia[];
    originalUrl: string;
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

export type PhotoEntity = BaseEntity<
  "photo",
  {
    id: string;
    description: string;
    alt: string;
    tags: string[];
    featured: boolean;
    orientation: "landscape" | "portrait" | "square";
    thumbnailSmall: {
      url: string;
      width: number;
      height: number;
    };
    thumbnailLarge: {
      url: string;
      width: number;
      height: number;
    };
    fullSize: {
      url: string;
      width: number;
      height: number;
    };
    albumSlug: string;
    albumTotalPhotos: number;
    indexString: string;
    previous: string | null;
    next: string | null;
    albumTitle: string;
    date: string;
  }
>;

export type AlbumData = {
  title: string;
  slug: string;
  description: string | null;
  date: string;
  photoOrder: string[];
};

export type AlbumEntity = BaseEntity<
  "album",
  AlbumData & {
    tags: string[];
    coverPhotos: string[];
  }
>;

export type Entity =
  | BlogPostEntity
  | StatusLolEntity
  | MastodonEntity
  | MicroBlogEntity
  | AlbumEntity
  | PhotoEntity;

export type OrderedEntities = {
  entities: Record<string, Entity>;
  entityOrder: string[];
};

export type Archive = OrderedEntities & {
  lastUpdated: string;
};

export type LoaderParams = {
  archive: Archive;
  cacheDirectory: string;
};
