import Bottleneck from "bottleneck";
import fs from "fs-extra";
import yaml from "js-yaml";
import {
  exists,
  Err,
  Ok,
  Result,
  uploadToCDN,
  hash,
  downloadAndCacheFile,
  cleanTags,
  filterErr,
  filterOk,
  entitiesToOrderedEntities,
} from "../utils";
import {
  AlbumEntity,
  AlbumPhotoEntity,
  AlbumPhotos,
  Albums,
  OrderedEntities,
} from "../types";
import sharp from "sharp";
import config from "../../config";
import { getFilesRecursive } from "../utils";

const FILE_NAME_REGEX = /([\w,\s-]+)\.[A-Za-z]{3}$/;

const photoLimiter = new Bottleneck({
  maxConcurrent: 8,
});

type AlbumData = {
  title: string;
  permalink: string;
  description: string | null;
  date: string;
  photoOrder: string[];
};

type PhotoMetadata = {
  albumPermalink: string;
  albumTotalPhotos: number;
  indexString: string;
  previous: string | null;
  next: string | null;
};

function orientationFromMetadata({
  width,
  height,
}: {
  width?: number | undefined;
  height?: number | undefined;
}): AlbumPhotoEntity["orientation"] {
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

function albumPermalink(title: string, date: string): string {
  const d = date.split("-");
  return `/albums/${d[0]}/${d[1]!.padStart(2, "0")}/${title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "")}/`.replace("//", "/");
}

function photoPermalink(
  albumTitle: string,
  albumDate: string,
  url: string
): Result<string> {
  const matches = url.match(FILE_NAME_REGEX);

  if (!matches) {
    return Err({
      type: "INVALID_FILE_NAME",
      path: url,
    });
  }

  const fileName = matches[1];

  if (!fileName) {
    return Err({
      type: "INVALID_FILE_NAME",
      path: url,
    });
  }

  return Ok(
    `${albumPermalink(albumTitle, albumDate)}/${fileName}`.replace("//", "/")
  );
}

async function resizeImage(
  buffer: Buffer,
  localPath: string,
  slug: string,
  size: "large" | "small",
  orientation: AlbumPhotoEntity["orientation"],
  originalWidth: number,
  originalHeight: number
): Promise<Result<{ url: string; width: number; height: number }>> {
  const aspectRatio = originalWidth / originalHeight;

  const width = config.photos[orientation][size];

  const height = Math.round(width / aspectRatio);

  const sizedPermalink = `${slug.slice(0, -4)}-${size}.jpg`;

  const existsResult = await exists(localPath);

  if (existsResult.ok && existsResult.value) {
    return Ok({
      url: sizedPermalink,
      width,
      height,
    });
  }

  try {
    const resized = await sharp(buffer)
      .resize(width, height)
      .jpeg({
        quality: 80,
      })
      .toBuffer();

    await fs.writeFile(localPath, resized);

    const uploadResult = await uploadToCDN(
      localPath,
      sizedPermalink,
      "image/jpeg"
    );

    if (!uploadResult.ok) {
      return uploadResult;
    }

    return Ok({
      url: sizedPermalink,
      width,
      height,
    });
  } catch (e) {
    return Err({
      type: "UNABLE_TO_RESIZE_IMAGE",
      path: localPath,
    });
  }
}

async function loadPhoto(
  photos: OrderedEntities<AlbumPhotoEntity>,
  photoData: any,
  album: AlbumData,
  photoMetadata: PhotoMetadata
): Promise<Result<AlbumPhotoEntity>> {
  const { url, alt, description, tags, featured } = photoData as {
    url: string | undefined;
    alt: string | undefined;
    description: string | undefined;
    tags: string[] | undefined;
    featured: boolean | undefined;
  };

  const rawDataHash = hash(photoData);

  const existing = photos.entities[rawDataHash];

  if (existing) {
    return Ok(existing);
  }

  if (!url) {
    return Err({
      type: "ALBUM_PHOTO_MISSING_URL",
    });
  }

  if (!alt) {
    return Err({
      type: "ALBUM_PHOTO_MISSING_ALT",
      url,
    });
  }

  const cached = await downloadAndCacheFile(`${config.cdn.url}${url}`);

  if (!cached.ok) {
    return cached;
  }

  const file = await fs.readFile(cached.value.cachePath);

  const buffer = Buffer.from(file);

  const metadata = await sharp(buffer).metadata();

  if (!metadata) {
    return Err({
      type: "ALBUM_PHOTO_MISSING_METADATA",
      url,
    });
  }

  const { width, height } = metadata;

  if (!width || !height) {
    return Err({
      type: "ALBUM_PHOTO_MISSING_METADATA",
      url,
    });
  }

  const orientation = orientationFromMetadata(metadata);

  const thumbnailLarge = await resizeImage(
    buffer,
    cached.value.cachePath,
    url,
    "large",
    orientation,
    width,
    height
  );

  if (!thumbnailLarge.ok) {
    return thumbnailLarge;
  }

  const thumbnailSmall = await resizeImage(
    buffer,
    cached.value.cachePath,
    url,
    "small",
    orientation,
    width,

    height
  );

  if (!thumbnailSmall.ok) {
    return thumbnailSmall;
  }

  const permalink = photoPermalink(album.title, album.date, url);

  if (!permalink.ok) {
    return permalink;
  }

  const smallThumbnail = {
    src: thumbnailSmall.value.url,
    width: thumbnailSmall.value.width,
    height: thumbnailSmall.value.height,
    alt,
  };

  return Ok({
    type: "albumPhoto",
    rawDataHash,
    key: permalink.value,
    permalink: permalink.value,
    description: description ?? alt,
    content: description ?? alt,
    tags: cleanTags(tags),
    featured: featured ?? false,
    orientation,
    fullSize: {
      src: url,
      width,
      height,
      alt,
    },
    thumbnailLarge: {
      src: thumbnailLarge.value.url,
      width: thumbnailLarge.value.width,
      height: thumbnailLarge.value.height,
      alt,
    },
    thumbnailSmall: smallThumbnail,
    media: [
      {
        image: smallThumbnail,
        parentPermalink: permalink.value,
        date: album.date,
      },
    ],
    date: album.date,
    albumTitle: album.title,
    ...photoMetadata,
  });
}

function calculateCoverPhotosForAlbum(photos: AlbumPhotoEntity[]): string[] {
  const featuredPhotos = photos.filter((photo) => photo.featured);
  const otherPhotos = photos.filter((photo) => !photo.featured);

  const featuredPortraitPhotos = featuredPhotos
    .filter((photo) => photo.orientation !== "landscape")
    .map((photo) => photo.key);
  const featuredLandscapePhotos = featuredPhotos
    .filter((photo) => photo.orientation === "landscape")
    .map((photo) => photo.key);
  const otherPortraitPhotos = otherPhotos
    .filter((photo) => photo.orientation !== "landscape")
    .map((photo) => photo.key);
  const otherLandscapePhotos = otherPhotos
    .filter((photo) => photo.orientation === "landscape")
    .map((photo) => photo.key);

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

  return photos[0] != null ? [photos[0].key] : [];
}

async function loadAlbum(
  albums: OrderedEntities<AlbumEntity>,
  photos: OrderedEntities<AlbumPhotoEntity>,
  filePath: string
): Promise<Result<{ album: AlbumEntity; photos: AlbumPhotoEntity[] }>> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const rawAlbumData = yaml.load(fileContents);

  const {
    title,
    description,
    date,
    photos: rawPhotos,
  } = rawAlbumData as {
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

  if (!title) {
    return Err({
      type: "ALBUM_MISSING_TITLE",
      path: filePath,
    });
  }

  if (!date) {
    return Err({
      type: "ALBUM_MISSING_DATE",
      path: filePath,
    });
  }

  const permalink = albumPermalink(title, date);

  const rawData = {
    permalink,
    title,
    description,
    date,
    photos: rawPhotos,
  };

  const rawDataHash = hash(rawData);

  const existing = albums.entities[permalink];

  if (existing && existing.rawDataHash === rawDataHash) {
    return Ok({
      album: existing,
      photos: existing.photoOrder
        .map((key) => photos.entities[key])
        .filter(Boolean) as AlbumPhotoEntity[],
    });
  }

  console.log(`Updating album: ${permalink}`);

  const photoOrderResults =
    rawPhotos?.map((photo) => photoPermalink(title, date, photo.url ?? "")) ??
    [];

  const errors = filterErr(photoOrderResults);

  if (errors.length > 0) {
    return Err(errors[0]!);
  }

  const photoOrder = filterOk(photoOrderResults);

  const albumData: AlbumData = {
    title,
    permalink,
    description: description ?? "",
    date,
    photoOrder,
  };

  const totalPhotosDigits = photoOrder.length.toString().length;

  const photosResults = await Promise.all(
    (rawPhotos ?? []).map((photo, index) =>
      photoLimiter.schedule(() =>
        loadPhoto(photos, photo, albumData, {
          albumPermalink: permalink,
          albumTotalPhotos: photoOrder.length,
          indexString: (index + 1).toString().padStart(totalPhotosDigits, "0"),
          next: photoOrder[index + 1] ?? null,
          previous: photoOrder[index - 1] ?? null,
        })
      )
    )
  );

  const photosErrors = filterErr(photosResults);

  if (photosErrors.length > 0) {
    return Err(photosErrors[0]!);
  }

  const photoEntities = filterOk(photosResults);

  const tags = photoEntities.reduce<Set<string>>((acc, photo) => {
    photo.tags.forEach((tag) => acc.add(tag));
    return acc;
  }, new Set<string>());

  const media = photoEntities.map((photo) => photo.media).flat();

  const album: AlbumEntity = {
    type: "album",
    rawDataHash,
    key: permalink,
    permalink,
    title,
    description: description ?? "",
    content: description ?? "",
    date,
    photoOrder,
    tags: Array.from(tags),
    coverPhotos: calculateCoverPhotosForAlbum(photoEntities),
    media,
  };

  return Ok({
    album,
    photos: photoEntities,
  });
}

export async function loadAlbumsAndPhotos(
  albums: OrderedEntities<AlbumEntity>,
  albumPhotos: OrderedEntities<AlbumPhotoEntity>,
  albumDir: string
): Promise<
  Result<{
    albums: Albums;
    albumPhotos: AlbumPhotos;
  }>
> {
  const paths = await getFilesRecursive(albumDir, ".yml");

  const albumEntites: AlbumEntity[] = [];
  let photoEntites: AlbumPhotoEntity[] = [];

  for (const filePath of paths) {
    const result = await loadAlbum(albums, albumPhotos, filePath);

    if (!result.ok) {
      return result;
    }

    const { album, photos } = result.value;

    albumEntites.push(album);
    photoEntites = photoEntites.concat(photos);
  }

  return Ok({
    albums: entitiesToOrderedEntities(albumEntites),
    albumPhotos: entitiesToOrderedEntities(photoEntites),
  });
}
