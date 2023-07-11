import path from "path";
import { Result, mergeOrderedEntities, writeFile } from "../utils";
import Data, {
  AlbumPhotoEntity,
  BlogPostEntity,
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  StatusLolEntity,
} from "../types";

export async function writeYears(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "years.json");

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

  const entitiesByYear = entitiesToInclude.entityOrder.reduce<
    Record<string, string[]>
  >((acc, key) => {
    const entity = entitiesToInclude.entities[key];

    if (!entity) {
      return acc;
    }

    const { date } = entity;

    const year = new Date(date).getFullYear();

    if (!acc[year]) {
      acc[year] = [];
    }

    acc[year]!.push(key);

    return acc;
  }, {});

  const years = Object.keys(entitiesByYear).sort((a, b) => {
    return parseInt(b) - parseInt(a);
  });

  const out = {
    years,
    entitiesByYear,
  };

  return writeFile(outputPath, JSON.stringify(out, null, 2));
}
