type EntityType = "media" | "blogPost" | "microBlog" | "microPost";

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
} & D;

export type BlogPostEntity = EntityBase<
  "blogPost",
  {
    title: string;
    description: string;
    content: string;
    tags: string[];
    hero: Image | null;
    showHero: boolean;
    media: EntityMedia[];
  }
>;

export type MicroBlogEntity = EntityBase<
  "microBlog",
  {
    content: string;
    tags: string[];
    media: EntityMedia[];
    description: string;
  }
>;

export type MicroPostEntity = EntityBase<
  "microPost",
  {
    content: string;
    tags: string[];
    media: EntityMedia[];
    description: string;
  }
>;

export type Entity = BlogPostEntity | MicroBlogEntity | MicroPostEntity;

export type OrderedEntities<E extends Entity> = {
  entityOrder: string[];
  entities: Record<string, E>;
};

export type BlogPosts = OrderedEntities<BlogPostEntity>;
export type MicroBlogs = OrderedEntities<MicroBlogEntity>;
export type MicroPosts = OrderedEntities<MicroPostEntity>;

type Archive = {
  blogPosts: BlogPosts;
  microBlogs: MicroBlogs;
  microPosts: MicroPosts;
  about: string;
  lastUpdated: string;
};
export default Archive;

export type LoaderParams<E extends Entity> = {
  orderedEntities: OrderedEntities<E>;
  cacheDir: string;
};
