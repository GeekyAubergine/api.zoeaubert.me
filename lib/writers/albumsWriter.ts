import fs from "fs";
import { filterOrderedEntitiesBy } from "../utils";
import path from "path";
import { AlbumEntity, Archive, Photo } from "../types";

export async function writeAlbums(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "albums.json");

  const albums = filterOrderedEntitiesBy(
    archive,
    (entity) => entity.type === "album"
  );

  const albumsByYearMap = albums.entityOrder.reduce<Record<string, string[]>>(
    (acc, id) => {
      const album = albums.entities[id];

      if (!album) {
        return acc;
      }

      const year = album.date.slice(0, 4);

      acc[year] = (acc[year] ?? []).concat(id);

      return acc;
    },
    {}
  );

  const albumsByYear = Object.entries(albumsByYearMap)
    .map(([year, ids]) => ({
      year,
      ids,
    }))
    .reverse();

  const photos = Object.values(albums.entities).reduce<Record<string, Photo>>(
    (acc, album: AlbumEntity) => {
      const { photos } = album;

      return {
        ...acc,
        ...photos,
      };
    },
    {}
  );

  const tagCounts = Object.values(photos).reduce<Record<string, number>>(
    (acc, photo) => {
      const { tags } = photo;

      for (const tag of tags) {
        acc[tag] = (acc[tag] ?? 0) + 1;
      }

      return acc;
    },
    {}
  );

  const tags = Object.entries(tagCounts)
    .map(([tag, count]) => ({
      tag,
      count,
      permalink: `/photos/tags/${tag}/index.html`,
      photos: Object.values(photos)
        .filter((photo) => photo.tags.includes(tag))
        .map((photo) => photo.id),
      albums: Object.values(albums.entities)
        .filter((album: AlbumEntity) => album.tags.includes(tag))
        .map((album) => album.id),
    }))
    .sort((a, b) => b.count - a.count);

  const out = {
    albums: albums.entities,
    albumOrder: albums.entityOrder,
    albumsByYear,
    photos,
    tags,
  };

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
