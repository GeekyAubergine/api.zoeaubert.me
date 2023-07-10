type EntityType =
  | "media"
  | "blogPost"
  | "microBlog"
  | "microPost"
  | "mastodon"
  | "statusLol"
  | "album"
  | "albumPhoto";

export type Image = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type EntityMedia = {
  image: Image;
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
    hero: Image | null;
    showHero: boolean;
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
    fullSize: Image;
    thumbnailSmall: Image;
    thumbnailLarge: Image;
    orientation: "landscape" | "portrait" | "square";
    albumPermalink: string;
    albumTotalPhotos: number;
    indexString: string;
    previous: string | null;
    next: string | null;
    albumTitle: string;
    featured: boolean,
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
export type MicroBlogs = OrderedEntities<MicroBlogEntity>;
export type MicroPosts = OrderedEntities<MicroPostEntity>;
export type MastodonPosts = OrderedEntities<MastodonPostEntity>;
export type StatusLolPosts = OrderedEntities<StatusLolEntity>;
export type Albums = OrderedEntities<AlbumEntity>;
export type AlbumPhotos = OrderedEntities<AlbumPhotoEntity>;

type Archive = {
  blogPosts: BlogPosts;
  microBlogs: MicroBlogs;
  microPosts: MicroPosts;
  mastodonPosts: MastodonPosts;
  statusLolPosts: StatusLolPosts;
  albums: Albums;
  albumPhotos: AlbumPhotos;
  about: string;
  lastUpdated: string;
};
export default Archive;

export type LoaderParams<E extends Entity> = {
  orderedEntities: OrderedEntities<E>;
  cacheDir: string;
};
