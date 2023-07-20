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

  // const entityOrder = photos
  //   .sort((a, b) => {
  //     const aDate = new Date(a.date);
  //     const bDate = new Date(b.date);
  //     return bDate.getTime() - aDate.getTime();
  //   })
  //   .map((entity) => entity.image.src);

  // const record = photos.reduce<Record<string, EntityMedia>>((acc, entity) => {
  //   acc[entity.image.src] = entity;
  //   return acc;
  // }, {});

  // const out = {
  //   allPhotos: record,
  //   allPhotosOrder: entityOrder,
  // };

  return writeFile(outputPath, JSON.stringify(photos, null, 2));
}
