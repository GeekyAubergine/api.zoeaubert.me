type BaseEntity<T, D> = {
  type: T;
  id: string;
  rawDataHash: string;
  date: string;
} & D;

export type BlogPostEntity = BaseEntity<
  "blogPost",
  {
    slug: string;
    title: string;
    description: string;
    content: string;
    tags: string[];
    heroImage: {
      url: string;
      alt: string;
    } | null;
  }
>;

export type StatusLolEntity = BaseEntity<
  "statuslol",
  {
    content: string;
    emoji: string;
    url: string;
  }
>;

export type MastodonEntity = BaseEntity<
  "mastodon",
  {
    content: string;
    url: string;
    tags: string[];
  }
>;

export type Entity = BlogPostEntity | StatusLolEntity | MastodonEntity;

export type Archive = {
  entities: Record<string, Entity>;
  entityOrder: string[];
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
