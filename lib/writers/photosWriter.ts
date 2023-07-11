import path from "path";
import { Result, mergeOrderedEntities, writeFile } from "../utils";
import Data, {
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
  archive: Data
): Promise<Result<undefined>> {
  const archivePath = path.join(outputDir, "photos.json");

  const entitiesToInclude = mergeOrderedEntities<
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

  return writeFile(archivePath, JSON.stringify(photos, null, 2));
}
