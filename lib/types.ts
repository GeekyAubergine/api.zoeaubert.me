export type BlogPostEntity = {
  type: "blogPost";
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

export type Entity = BlogPostEntity;
