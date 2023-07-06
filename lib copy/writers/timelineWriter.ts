import fs from "fs";
import { filterOrderedEntitiesBy } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeTimeline(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "timeline.json");

  const { entities, entityOrder } = filterOrderedEntitiesBy(
    archive,
    (entity) => entity.type !== "photo"
  );

  const entitiesByYear = entityOrder.reduce<Record<string, string[]>>(
    (acc, id) => {
      const entity = entities[id];
      if (!entity) {
        return acc;
      }

      const { date } = entity;

      const year = new Date(date).getFullYear();

      acc[year] = (acc[year] ?? []).concat(id);

      return acc;
    },
    {}
  );

  const years = Object.keys(entitiesByYear).sort((a, b) => {
    return parseInt(b) - parseInt(a);
  });

  const recentNonBlogEntities = entityOrder
    .filter((id) => {
      const entity = entities[id];
      if (!entity) {
        return false;
      }

      const { type } = entity;

      return type !== "blogPost";
    })
    .slice(0, 5);

  const out = {
    entities,
    entityOrder,
    years,
    entitiesByYear,
    recentEntityOrder: entityOrder.slice(0, 5),
    recentNonBlogEntities,
  };

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
