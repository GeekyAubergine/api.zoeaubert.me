import path from "path";
import { Result, mergeOrderedEntities, writeJSONFile } from "../utils";
import Data, {
  AlbumEntity,
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
    | AlbumEntity
  >([
    data.microPosts,
    data.mastodonPosts,
    data.statusLolPosts,
    data.microBlogsPosts,
    data.blogPosts,
    data.albums,
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

  return writeJSONFile(outputPath, out);
}
