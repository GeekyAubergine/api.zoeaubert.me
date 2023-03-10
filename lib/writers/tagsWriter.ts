import fs from "fs";
import { exhaust, filterOrderedEntitiesBy } from "../utils";
import path from "path";
import { Archive } from "../types";
import natsort from "natsort";

export async function writeTags(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "tags.json");

  const { entities, entityOrder } = filterOrderedEntitiesBy(
    archive,
    (entity) => entity.type !== "photo" && entity.type !== "album"
  );

  const allTags = Object.values(entities).reduce<string[]>((acc, entity) => {
    const { type } = entity;
    switch (type) {
      case "blogPost":
      case "micro":
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
      case "album":
      case "photo":
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
        case "micro":
        case "mastodon":
        case "microblog": {
          const { tags } = entity;
          return tags.includes(tag);
        }
        case "album":
        case "photo":
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
    entitiesByTag,
    allTags: allTags.sort(natsort()),
  };

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
