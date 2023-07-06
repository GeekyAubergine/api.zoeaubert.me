type EntityType = "media" | "blogPost";

export type Image = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type EntityMedia = {
  image: Image;
  postSlug: string;
  date: string;
};

type EntityBase<T extends EntityType, D> = {
  rawDataHash: string;
  type: T;
  key: string;
  slug: string;
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

export type Entity = BlogPostEntity;

export type OrderedEntities<E extends Entity> = {
  entityOrder: string[];
  entities: Record<string, E>;
};

export type BlogPosts = OrderedEntities<BlogPostEntity>;
// export type Media = OrderedEntities<EntityMedia>;

type Archive = {
  blogPosts: BlogPosts;
  lastUpdated: string;
};
export default Archive;

export type LoaderParams<E extends Entity> = {
  orderedEntities: OrderedEntities<E>;
  cacheDir: string;
};
