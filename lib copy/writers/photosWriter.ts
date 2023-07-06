import fs from "fs";
import { exhaust } from "../utils";
import path from "path";
import { Archive, EntityMedia } from "../types";

export async function writePhotos(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "photos.json");

  const { entities, entityOrder } = archive;

  const photos = entityOrder.reduce<EntityMedia[]>((acc, id) => {
    const entity = entities[id];

    if (!entity) {
      return acc;
    }

    const { type } = entity;

    switch (type) {
      case "photo":
        return acc.concat([
          {
            type: "image",
            url: entity.thumbnailSmall.url,
            alt: entity.alt,
            date: entity.date,
            postSlug: entity.slug,
            width: entity.thumbnailSmall.width,
            height: entity.thumbnailSmall.height,
          },
        ]);
      case "blogPost":
      case "mastodon":
      case "microblog":
      case "micro":
        return acc.concat(entity.media);
      case "album":
      case "statuslol":
        return acc;
      default:
        return exhaust(type);
    }
  }, []);

  return fs.promises.writeFile(archivePath, JSON.stringify(photos, null, 2));
}
