type EntityMedia = { url: string; alt: string };

type BaseEntity<T, D> = {
  rawDataHash: string;
  type: T;
  id: string;
  url: string;
  date: string;
  content: string;
  media: EntityMedia[];
} & D;

export type BlogPostEntity = BaseEntity<
  "blogPost",
  {
    title: string;
    description: string;
    tags: string[];
    hero: {
      url: string;
      alt: string;
      showHero: boolean;
    } | null;
  }
>;

export type StatusLolEntity = BaseEntity<
  "statuslol",
  {
    emoji: string;
  }
>;

export type MastodonEntity = BaseEntity<
  "mastodon",
  {
    tags: string[];
  }
>;

export type MicroBlogEntity = BaseEntity<
  "microblog",
  {
    tags: string[];
  }
>;

export type Entity =
  | BlogPostEntity
  | StatusLolEntity
  | MastodonEntity
  | MicroBlogEntity;

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
