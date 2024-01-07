import {
  CONTENT_TO_FILTER_OUT,
  Err,
  Ok,
  Result,
  cleanTags,
  getImageOrientation,
  readFile,
} from "../utils";
import { SourceDataImage } from "../types";

export type SourceDataMicroBlogArchivePost = {
  key: string;
  date: string;
  content: string;
  description: string;
  tags: string[];
  images: SourceDataImage[];
};

export type SourceDataMicroBlogArchivePosts = Record<
  string,
  SourceDataMicroBlogArchivePost
>;

export const DEFAULT_SOURCE_DATA_MICRO_BLOG_ARCHIVE_POSTS: SourceDataMicroBlogArchivePosts =
  {};

const REGEX_IMAGES =
  /<img src="(.*?)".*?width="(.*?)".*?height="(.*?)".*?alt="(.*?)"/gm;

function mapMicroBlog(microBlog: any): SourceDataMicroBlogArchivePost {
  // const permalink = microBlog.id
  //   .replace("http://geekyaubergine.micro.blog/", "/micros/")
  //   .replace(".html", "");

  const date = new Date(microBlog.date_published).toISOString();

  const content = microBlog.content_text.replace(
    /uploads\//g,
    "https://cdn.geekyaubergine.com/"
  );

  const imagesMatch = (content as string).matchAll(REGEX_IMAGES);

  const images: SourceDataImage[] = [];

  for (const match of imagesMatch) {
    const [, src, width, height, alt] = match;
    // No need to throw error as we trust this data as it's been previously validated and is never updated
    if (!src || !alt || !width || !height) {
      continue;
    }
    images.push({
      src,
      alt,
      width: parseInt(width, 10),
      height: parseInt(height, 10),
      title: alt,
      orientation: getImageOrientation(
        parseInt(width, 10),
        parseInt(height, 10)
      ),
    });
  }

  const firstLine = content.split("\n")[0];

  return {
    key: `micro-blog-${microBlog.id}`,
    date,
    content,
    description: firstLine ?? "",
    tags: cleanTags(microBlog.tags ?? []),
    images,
  };
}

export async function loadMicroBlogArchive(
  microBlogoutputPath: string
): Promise<Result<SourceDataMicroBlogArchivePosts>> {
  try {
    const archiveContents = await readFile(microBlogoutputPath);

    if (!archiveContents.ok) {
      return archiveContents;
    }

    const archive = JSON.parse(archiveContents.value);

    const posts: SourceDataMicroBlogArchivePost[] = archive.items
      .map(mapMicroBlog)
      .filter(
        (micro: SourceDataMicroBlogArchivePost) =>
          !CONTENT_TO_FILTER_OUT.test(micro.content) &&
          !micro.tags.includes("status") &&
          !micro.tags.includes("Status") &&
          !micro.tags.includes("photography") &&
          !micro.tags.includes("Photography")
      );

    const data = posts.reduce<SourceDataMicroBlogArchivePosts>((acc, post) => {
      acc[post.key] = post;
      return acc;
    }, {});

    return Ok(data);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_READ_FILE",
      path: microBlogoutputPath,
    });
  }
}
