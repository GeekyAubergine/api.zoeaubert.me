import path from "path";
import { Result, writeJSONFile } from "../utils";
import { Data } from "../types";

export async function writeAlbumsAndPhoto(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "albums.json");

  const albumsByYearMap = data.albums.entityOrder.reduce<
    Record<string, string[]>
  >((acc, key) => {
    const entity = data.albums.entities[key];

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

  const years = Object.keys(albumsByYearMap).sort((a, b) => {
    return parseInt(b) - parseInt(a);
  });

  const albumsByYear = years
    .map((year) => ({
      year,
      albums: albumsByYearMap[year]!,
    }));

  const out = {
    albums: data.albums.entities,
    albumOrder: data.albums.entityOrder,
    albumPhotos: data.albumPhotos.entities,
    albumPhotoOrder: data.albumPhotos.entityOrder,
    albumsByYear,
  };

  return writeJSONFile(outputPath, out);
}
