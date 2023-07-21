import path from "path";
import natsort from "natsort";
import { Result, mergeOrderedEntities, writeJSONFile } from "../utils";
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
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "tags.json");

  const entitiesToInclude = mergeOrderedEntities<
    | MicroPostEntity
    | MastodonPostEntity
    | StatusLolEntity
    | MicroBlogEntity
    | BlogPostEntity
    | AlbumPhotoEntity
  >([
    data.microPosts,
    data.mastodonPosts,
    data.statusLolPosts,
    data.microBlogsPosts,
    data.blogPosts,
    data.albumPhotos,
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

  const postsByTag = Array.from(allTags).reduce<Record<string, string[]>>(
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

  const tagCounts = Object.keys(postsByTag).reduce<Record<string, number>>(
    (acc, tag) => {
      const entitiesWithTag = postsByTag[tag];

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
    postsByTag,
  };

  return writeJSONFile(outputPath, out);
}
