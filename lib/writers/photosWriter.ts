import path from "path";
import { Result, mergeOrderedEntities, writeJSONFile } from "../utils";
import {
  Data,
  AlbumEntity,
  BlogPostEntity,
  EntityMedia,
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  StatusLolEntity,
} from "../types";

export async function writePhotos(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "photos.json");

  const entitiesToInclude = mergeOrderedEntities<
    | MicroPostEntity
    | MastodonPostEntity
    | StatusLolEntity
    | MicroBlogEntity
    | BlogPostEntity
    | AlbumEntity
  >([
    data.microPosts,
    data.mastodonPosts,
    data.statusLolPosts,
    data.microBlogsPosts,
    data.blogPosts,
    data.albums,
  ]);

  const photos = entitiesToInclude.entityOrder.reduce<EntityMedia[]>(
    (acc, key) => {
      const entity = entitiesToInclude.entities[key];

      if (!entity) {
        return acc;
      }

      return acc.concat(entity.media);
    },
    []
  );

  return writeJSONFile(outputPath, photos);
}
