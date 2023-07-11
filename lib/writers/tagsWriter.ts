import path from "path";
import natsort from "natsort";
import { Result, mergeOrderedEntities, writeFile } from "../utils";
import Data, {
  AlbumPhotoEntity,
  BlogPostEntity,
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  StatusLolEntity,
} from "../types";

export async function writeTags(
  outputDir: string,
  archive: Data
): Promise<Result<undefined>> {
  const archivePath = path.join(outputDir, "tags.json");

  const entitiesToInclude = mergeOrderedEntities<
    | MicroPostEntity
    | MastodonPostEntity
    | StatusLolEntity
    | MicroBlogEntity
    | BlogPostEntity
    | AlbumPhotoEntity
  >([
    archive.microPosts,
    archive.mastodonPosts,
    archive.statusLolPosts,
    archive.microBlogsPosts,
    archive.blogPosts,
    archive.albumPhotos,
  ]);

  const allTags = Array.from(
    entitiesToInclude.entityOrder.reduce<Set<string>>((acc, key) => {
      const entity = entitiesToInclude.entities[key];

      if (entity && entity.tags) {
        entity.tags.forEach((tag) => acc.add(tag));
      }

      return acc;
    }, new Set())
  ).sort(natsort());

  const entitiesByTag = Array.from(allTags).reduce<Record<string, string[]>>(
    (acc, tag) => {
      const entitiesWithTag = entitiesToInclude.entityOrder.filter((id) => {
        const entity = entitiesToInclude.entities[id];

        if (!entity) {
          return false;
        }

        return entity.tags.includes(tag);
      });

      return {
        ...acc,
        [tag]: entitiesWithTag,
      };
    },
    {}
  );

  const tagCounts = Object.keys(entitiesByTag).reduce<Record<string, number>>(
    (acc, tag) => {
      const entitiesWithTag = entitiesByTag[tag];

      if (!entitiesWithTag) {
        return acc;
      }

      acc[tag] = entitiesWithTag.length;
      return acc;
    },
    {}
  );

  const out = {
    allTags: Array.from(allTags).sort(natsort()),
    tagCounts,
    entitiesByTag,
  };

  return writeFile(archivePath, JSON.stringify(out, null, 2));
}
