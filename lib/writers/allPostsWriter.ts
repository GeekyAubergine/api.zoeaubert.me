import path from "path";
import { Result, mergeOrderedEntities, writeFile } from "../utils";
import Data, {
  AlbumEntity,
  AlbumPhotoEntity,
  BlogPostEntity,
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  StatusLolEntity,
} from "../types";

export async function writeAllPosts(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "all-posts.json");

  const entities = mergeOrderedEntities<
    | MicroPostEntity
    | MastodonPostEntity
    | StatusLolEntity
    | MicroBlogEntity
    | BlogPostEntity
    | AlbumEntity
    | AlbumPhotoEntity
  >([
    data.microPosts,
    data.mastodonPosts,
    data.statusLolPosts,
    data.microBlogsPosts,
    data.blogPosts,
    data.albums,
    data.albumPhotos,
  ]);

  return writeFile(outputPath, JSON.stringify(entities, null, 2));
}
