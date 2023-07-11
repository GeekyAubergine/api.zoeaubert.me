import path from "path";
import { Result, mergeOrderedEntities, writeFile } from "../utils";
import Data, {
  AlbumEntity,
  BlogPostEntity,
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  StatusLolEntity,
} from "../types";

export async function writeTimeline(
  outputDir: string,
  archive: Data
): Promise<Result<undefined>> {
  const archivePath = path.join(outputDir, "timeline.json");

  const entities = mergeOrderedEntities<
    | MicroPostEntity
    | MastodonPostEntity
    | StatusLolEntity
    | MicroBlogEntity
    | BlogPostEntity
    | AlbumEntity
  >([
    archive.microPosts,
    archive.mastodonPosts,
    archive.statusLolPosts,
    archive.microBlogsPosts,
    archive.blogPosts,
    archive.albums,
  ]);

  return writeFile(archivePath, JSON.stringify(entities, null, 2));
}
