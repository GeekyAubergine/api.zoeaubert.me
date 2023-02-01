import fs from "fs";
import { exhaust } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeTimeline(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "timeline.json");

  const { entities, entityOrder } = archive;

  const allTags = Object.values(entities).reduce<string[]>((acc, entity) => {
    const { type } = entity;
    switch (type) {
      case "blogPost":
      case "mastodon":
      case "microblog": {
        const { tags } = entity;
        const newTags = [];
        for (const tag of tags) {
          if (!acc.includes(tag)) {
            newTags.push(tag);
          }
        }
        return acc.concat(newTags);
      }
      case "statuslol":
        return acc;
      default:
        return exhaust(type);
    }
  }, []);

  const entitiesByTag = allTags.reduce<Record<string, string[]>>((acc, tag) => {
    const entitiesWithTag = entityOrder.filter((id) => {
      const entity = entities[id];

      if (!entity) {
        return false;
      }

      const { type } = entity;
      switch (type) {
        case "blogPost":
        case "mastodon":
        case "microblog": {
          const { tags } = entity;
          return tags.includes(tag);
        }
        case "statuslol":
          return false;
        default:
          return exhaust(type);
      }
    });

    return {
      ...acc,
      [tag]: entitiesWithTag,
    };
  }, {});

  const out = {
    entities,
    entityOrder,
    entitiesByTag,
    allTags,
  };

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
