import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import sharp from "sharp";
import Bottleneck from "bottleneck";
import config from "../../config";
import {
  AlbumData,
  AlbumEntity,
  Archive,
  Entity,
  LoaderParams,
  PhotoEntity,
} from "../types";

import {
  arrayToRecord,
  downloadAndCacheFile,
  exists,
  getFilesRecursive,
  hash,
  stripDoubleSlashes,
  uploadToCDN,
  // uploadToCDN,
} from "../utils";

const ALBUMS_DIR = path.join(__dirname, "../../albums");

const FILE_NAME_REGEX = /([\w,\s-]+)\.[A-Za-z]{3}$/;

const photoLimiter = new Bottleneck({
  maxConcurrent: 8,
});

function orientationFromMetadata({
  width,
  height,
}: {
  width?: number | undefined;
  height?: number | undefined;
}): PhotoEntity["orientation"] {
  if (!height || !width) {
    throw new Error("No height or width found");
  }

  if (height > width) {
    return "portrait";
  }

  if (height === width) {
    return "square";
  }

  return "landscape";
}

function albumToSlug(title: string, date: string): string {
  const d = date.split("-");
  return `/albums/${d[0]}/${d[1]!.padStart(2, "0")}/${title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "")}/`;
}

function photoSlug(album: { title: string; date: string }, url: string) {
  const matches = url.match(FILE_NAME_REGEX);

  if (!matches) {
    throw new Error("No file name found");
  }

  const fileName = matches[1];

  if (!fileName) {
    throw new Error("No file name found");
  }

  return stripDoubleSlashes(
    `${albumToSlug(album.title, album.date)}/${fileName}`
  );
}

async function resizeImage(
  buffer: Buffer,
  slug: string,
  size: "large" | "small",
  orientation: PhotoEntity["orientation"],
  originalWidth: number,
  originalHeight: number
): Promise<{
  url: string;
  width: number;
  height: number;
}> {
  const aspectRatio = originalWidth / originalHeight;

  const width = config.photos[orientation][size];

  const height = Math.round(width / aspectRatio);

  const sizedSlug = `${slug.slice(0, -4)}-${size}.jpg`;

  const localPath = `${config.cacheDir}${sizedSlug}`;

  if (await exists(localPath)) {
    return {
      url: sizedSlug,
      width,
      height,
    };
  }

  console.log(`Processing ${sizedSlug} not found at ${localPath}`);

  const resized = await sharp(buffer)
    .resize(width, height)
    .jpeg({
      quality: 80,
    })
    .toBuffer();

  await fs.promises.writeFile(localPath, resized);

  await uploadToCDN(localPath, sizedSlug, "image/jpeg");

  return {
    url: sizedSlug,
    width,
    height,
  };
}

async function loadPhoto(
  archive: Archive,
  photoData: any,
  album: AlbumData
): Promise<
  Omit<
    PhotoEntity,
    | "next"
    | "previous"
    | "indexString"
    | "albumTotalPhotos"
    | "albumTitle"
    | "date"
    | "albumSlug"
  >
> {
  try {
    const { url, alt, description, tags, featured } = photoData as {
      url: string | undefined;
      alt: string | undefined;
      description: string | undefined;
      tags: string[] | undefined;
      featured: boolean | undefined;
    };

    const rawDataHash = hash(photoData);

    if (archive.entities[rawDataHash]) {
      return archive.entities[rawDataHash] as PhotoEntity;
    }

    if (!url || !alt) {
      throw new Error(`Photo is missing required attributes: ${url}`);
    }

    const chachedUrl = await downloadAndCacheFile(`${config.cdn.url}${url}`);

    const file = await fs.promises.readFile(chachedUrl);

    const buffer = Buffer.from(file);

    const metadata = await sharp(buffer).metadata();

    if (!metadata) {
      throw new Error("No metadata found");
    }

    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error("No width or height found");
    }

    const orientation = orientationFromMetadata(metadata);

    const thumbnailLarge = await resizeImage(
      buffer,
      url,
      "large",
      orientation,
      width,

      height
    );

    const thumbnailSmall = await resizeImage(
      buffer,
      url,
      "small",
      orientation,
      width,
      height
    );

    const slug = photoSlug(album, url);

    return {
      type: "photo",
      rawDataHash,
      id: slug.replace("/albums", ""),
      slug,
      alt,
      description: description ?? alt,
      tags: tags ?? [],
      featured: featured ?? false,
      orientation,
      fullSize: {
        url,
        width,
        height,
      },
      thumbnailLarge,
      thumbnailSmall,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function calculateCoverPhotosForAlbum(
  photosMap: Record<string, PhotoEntity>
): string[] {
  const photos = Object.values(photosMap);

  const featuredPhotos = photos.filter((photo) => photo.featured);
  const otherPhotos = photos.filter((photo) => !photo.featured);

  const featuredPortraitPhotos = featuredPhotos
    .filter((photo) => photo.orientation !== "landscape")
    .map((photo) => photo.id);
  const featuredLandscapePhotos = featuredPhotos
    .filter((photo) => photo.orientation === "landscape")
    .map((photo) => photo.id);
  const otherPortraitPhotos = otherPhotos
    .filter((photo) => photo.orientation !== "landscape")
    .map((photo) => photo.id);
  const otherLandscapePhotos = otherPhotos
    .filter((photo) => photo.orientation === "landscape")
    .map((photo) => photo.id);

  // If featured landscape, use that
  if (featuredLandscapePhotos[0]) {
    return [featuredLandscapePhotos[0]];
  }

  // If 2 featured portrait, use that
  if (featuredPortraitPhotos[0] && featuredPortraitPhotos[1]) {
    return [featuredPortraitPhotos[0], featuredPortraitPhotos[1]];
  }

  // If 1 featured portrait and 1 other portrait, use that
  if (featuredPortraitPhotos[0] && otherPortraitPhotos[0]) {
    return [featuredPortraitPhotos[0], otherPortraitPhotos[0]];
  }

  // If otherLandscapePhotos, use that
  if (otherLandscapePhotos[0]) {
    return [otherLandscapePhotos[0]];
  }

  // If otherPortraitPhotos, use that
  if (otherPortraitPhotos.length > 0) {
    return otherPortraitPhotos.slice(0, 1);
  }

  return photos[0] != null ? [photos[0].id] : [];
}

async function loadAlbum(
  archive: Archive,
  filePath: string
): Promise<{
  album: AlbumEntity;
  photos: Record<string, PhotoEntity>;
}> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const albumData = yaml.load(fileContents);

  const {
    title,
    description,
    date,
    photos: rawPhotos,
  } = albumData as {
    title: string | undefined;
    description: string | undefined;
    date: string | undefined;
    photos:
      | {
          url: string | undefined;
          alt: string | undefined;
          description: string | undefined;
          tags: string[] | undefined;
          featured: boolean | undefined;
        }[]
      | undefined;
  };

  if (!title || !date) {
    throw new Error(`Album is missing required attributes: ${filePath}`);
  }

  const slug = albumToSlug(title, date);

  const id = slug;

  const rawData = {
    id,
    title,
    description,
    date,
    photos: rawPhotos,
  };

  const rawDataHash = hash(rawData);

  const existingEntity = archive.entities[rawData.id];

  if (existingEntity && existingEntity.rawDataHash === rawDataHash) {
    return {
      album: existingEntity as AlbumEntity,
      photos: {},
    };
  }

  console.log(`Updating album: ${rawData.id} (${rawData.title})`);

  const photoOrder =
    rawPhotos?.map((photo) => photoSlug(rawData, photo.url ?? "")) ?? [];

  const album: AlbumData = {
    title,
    slug,
    date,
    description: description ?? "",
    photoOrder,
  };

  const photosRaw = await Promise.all(
    (rawPhotos ?? []).map((photoData: any) =>
      photoLimiter.schedule(() => loadPhoto(archive, photoData, album))
    )
  );

  const totalPhotosDigits = photosRaw.length.toString().length;

  const photos: PhotoEntity[] = photosRaw.map(
    (photo, index): PhotoEntity => ({
      ...photo,
      indexString: (index + 1).toString().padStart(totalPhotosDigits, "0"),
      albumTotalPhotos: album.photoOrder.length,
      albumTitle: album.title,
      date: album.date,
      albumSlug: album.slug,
      next: photosRaw[index + 1]?.id ?? null,
      previous: photosRaw[index - 1]?.id ?? null,
    })
  );

  const photosMap = arrayToRecord(photos, (photo) => photo.id);

  const tags = photosRaw.reduce<string[]>((acc, photo) => {
    const newTags = [];

    for (const tag of photo.tags) {
      if (!acc.includes(tag)) {
        newTags.push(tag);
      }
    }

    return [...acc, ...newTags];
  }, []);

  const data: AlbumEntity = {
    type: "album",
    ...album,
    rawDataHash,
    id: slug,
    slug,
    tags,
    photoOrder: photosRaw.map((photo) => photo.id),
    coverPhotos: calculateCoverPhotosForAlbum(photosMap),
  };

  return {
    album: data,
    photos: photosMap,
  };
}

export async function loadAlbums(
  loaderParams: LoaderParams
): Promise<Record<string, Entity>> {
  const { archive } = loaderParams;

  const paths = await getFilesRecursive(ALBUMS_DIR, ".yml");

  const albums = await Promise.all(
    paths.map((path) => loadAlbum(archive, path))
  );

  const entities = albums.reduce<Record<string, Entity>>(
    (acc, { album, photos }) => ({
      ...acc,
      [album.id]: album,
      ...photos,
    }),
    {}
  );

  return entities;
}
