import fs from "fs";
import { filterOrderedEntitiesBy } from "../utils";
import path from "path";
import { AlbumEntity, Archive, PhotoEntity } from "../types";

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

  const photos = filterOrderedEntitiesBy(
    archive,
    (entity) => entity.type === "photo"
  );

  const tagCounts = Object.values(photos.entities).reduce<
    Record<string, number>
  >((acc, photo: PhotoEntity) => {
    const { tags } = photo;

    for (const tag of tags) {
      acc[tag] = (acc[tag] ?? 0) + 1;
    }

    return acc;
  }, {});

  const tags = Object.entries(tagCounts)
    .map(([tag, count]) => ({
      tag,
      count,
      permalink: `/albums/tags/${tag}/index.html`,
      albums: Object.values(albums.entities)
        .filter((album: AlbumEntity) => album.tags.includes(tag))
        .map((album: AlbumEntity) => ({
          albumId: album.id,
          photoOrder: album.photoOrder.filter((id) =>
            (photos.entities[id] as PhotoEntity | null)?.tags.includes(tag)
          ),
        })),
    }))
    .sort((a, b) => b.count - a.count);

  const out = {
    albums: albums.entities,
    albumOrder: albums.entityOrder,
    albumsByYear,
    photos: photos.entities,
    photoIds: photos.entityOrder,
    tags,
  };

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
