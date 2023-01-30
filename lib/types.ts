export type BlogPostEntity = {
  type: "blogPost";
  id: string;
  slug: string;
  title: string;
  date: Date;
  description: string;
  content: string;
  tags: string[];
  heroImage: {
    url: string;
    alt: string;
  } | null;
};

export type StatusLolEntity = {
  type: "statuslol";
  id: string;
  date: Date;
  content: string;
  emoji: string;
  url: string;
};

export type Entity = BlogPostEntity | StatusLolEntity;
