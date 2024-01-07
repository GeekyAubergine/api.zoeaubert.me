import Bottleneck from "bottleneck";
import fs from "fs-extra";
import yaml from "js-yaml";
import path from "path";
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
  orderedEntitesFromArray,
  getImageSize,
  getImageOrientation,
} from "../utils";
import {
  AlbumEntity,
  AlbumPhotoEntity,
  AlbumPhotos,
  Albums,
  ImageOrientation,
  OrderedEntities,
  SourceDataImage,
} from "../types";
import sharp from "sharp";
import config from "../../config";
import { getFilesRecursive } from "../utils";

const FILE_NAME_REGEX = /([\w,\s-]+)\.[A-Za-z]{3}$/;

const photoLimiter = new Bottleneck({
  maxConcurrent: 2,
});

export type SourceDataAlbum = {
  key: string,
  title: string;
  description: string | null;
  date: string;
  coverPhotos: SourceDataImage[];
  images: SourceDataImage[];
};

export type SourceDataAlbums = Record<string, SourceDataAlbum>;

export const DEFAULT_SOURCE_DATA_ALBUMS: SourceDataAlbums = {};

// function albumPermalink(title: string, date: string): string {
//   const d = date.split("-");
//   return `/albums/${d[0]}/${d[1]!.padStart(2, "0")}/${title
//     .toLowerCase()
//     .replace(/ /g, "-")
//     .replace(/[^a-z0-9-]/g, "")}/`.replace("//", "/");
// }

// function photoPermalink(
//   albumTitle: string,
//   albumDate: string,
//   url: string
// ): Result<string> {
//   const matches = url.match(FILE_NAME_REGEX);

//   if (!matches) {
//     return Err({
//       type: "INVALID_FILE_NAME",
//       path: url,
//     });
//   }

//   const fileName = matches[1];

//   if (!fileName) {
//     return Err({
//       type: "INVALID_FILE_NAME",
//       path: url,
//     });
//   }

//   return Ok(
//     `${albumPermalink(albumTitle, albumDate)}/${fileName}`.replace("//", "/")
//   );
// }

// async function resizeImage(
//   buffer: Buffer,
//   slug: string,
//   size: "large" | "small",
//   orientation: ImageOrientation,
//   originalWidth: number,
//   originalHeight: number
// ): Promise<Result<{ url: string; width: number; height: number }>> {
//   const aspectRatio = originalWidth / originalHeight;

//   const width = config.photos[orientation][size];

//   const height = Math.round(width / aspectRatio);

//   const sizedPermalink = `${slug.slice(0, -4)}-${size}.jpg`;

//   const cachePath = `${config.cacheDir}${sizedPermalink}`;

//   const existsResult = await exists(cachePath);

//   if (existsResult.ok && existsResult.value) {
//     return Ok({
//       url: sizedPermalink,
//       width,
//       height,
//     });
//   }

//   try {
//     const resized = await sharp(buffer)
//       .resize(width, height)
//       .jpeg({
//         quality: config.imageQuality[size],
//       })
//       .toBuffer();

//     await fs.mkdir(path.dirname(cachePath), { recursive: true });

//     await fs.writeFile(cachePath, resized);

//     const uploadResult = await uploadToCDN(
//       cachePath,
//       sizedPermalink,
//       "image/jpeg"
//     );

//     if (!uploadResult.ok) {
//       return uploadResult;
//     }

//     return Ok({
//       url: sizedPermalink,
//       width,
//       height,
//     });
//   } catch (e) {
//     return Err({
//       type: "UNABLE_TO_RESIZE_IMAGE",
//       path: cachePath,
//     });
//   }
// }

function calculateCoverPhotosForAlbum(
  photos: (SourceDataImage & { featured: boolean })[]
): SourceDataImage[] {
  const featuredPhotos = photos.filter((photo) => photo.featured);
  const otherPhotos = photos.filter((photo) => !photo.featured);

  const featuredPortraitPhotos = featuredPhotos.filter(
    (photo) => photo.orientation !== "landscape"
  );
  const featuredLandscapePhotos = featuredPhotos.filter(
    (photo) => photo.orientation === "landscape"
  );
  const otherPortraitPhotos = otherPhotos.filter(
    (photo) => photo.orientation !== "landscape"
  );
  const otherLandscapePhotos = otherPhotos.filter(
    (photo) => photo.orientation === "landscape"
  );

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

  return photos[0] != null ? [photos[0]] : [];
}

async function loadPhoto({
  path,
  url,
  alt,
  cacheDir,
}: {
  path: string;
  url: string;
  alt: string;
  cacheDir: string;
}): Promise<Result<SourceDataImage>> {
  if (!url) {
    return Err({
      type: "ALBUM_PHOTO_MISSING_URL",
      path,
    });
  }

  if (!alt) {
    return Err({
      type: "ALBUM_PHOTO_MISSING_ALT",
      url,
    });
  }

  const cacheResult = await downloadAndCacheFile(
    `${config.cdn.url}${url}`,
    cacheDir
  );

  if (!cacheResult.ok) {
    return cacheResult;
  }

  const imageSize = await getImageSize(cacheResult.value.cachePath);

  if (!imageSize.ok) {
    return imageSize;
  }

  const orientation = getImageOrientation(
    imageSize.value.width,
    imageSize.value.height
  );

  return Ok({
    src: url,
    alt,
    width: imageSize.value.width,
    height: imageSize.value.height,
    orientation,
  });

  // const file = await fs.readFile(cached.value.cachePath);

  // const buffer = Buffer.from(file);

  // const metadata = await sharp(buffer).metadata();

  // if (!metadata) {
  //   return Err({
  //     type: "ALBUM_PHOTO_MISSING_METADATA",
  //     url,
  //   });
  // }

  // const { width, height } = metadata;

  // if (!width || !height) {
  //   return Err({
  //     type: "ALBUM_PHOTO_MISSING_METADATA",
  //     url,
  //   });
  // }

  // const orientation = orientationFromMetadata(metadata);

  // const thumbnailLarge = await resizeImage(
  //   buffer,
  //   url,
  //   "large",
  //   orientation,
  //   width,
  //   height
  // );

  // if (!thumbnailLarge.ok) {
  //   return thumbnailLarge;
  // }

  // const thumbnailSmall = await resizeImage(
  //   buffer,
  //   url,
  //   "small",
  //   orientation,
  //   width,
  //   height
  // );

  // if (!thumbnailSmall.ok) {
  //   return thumbnailSmall;
  // }

  // const permalink = photoPermalink(album.title, album.date, url);

  // if (!permalink.ok) {
  //   return permalink;
  // }

  // const smallThumbnail = {
  //   src: thumbnailSmall.value.url,
  //   width: thumbnailSmall.value.width,
  //   height: thumbnailSmall.value.height,
  //   alt,
  //   title: alt,
  //   orientation,
  // };

  // return Ok({
  //   type: "albumPhoto",
  //   rawDataHash,
  //   key: permalink.value,
  //   permalink: permalink.value,
  //   description: description ?? alt,
  //   content: description ?? alt,
  //   tags: cleanTags(tags),
  //   featured: featured ?? false,
  //   fullSize: {
  //     src: url,
  //     width,
  //     height,
  //     alt,
  //     title: alt,
  //     orientation,
  //   },
  //   thumbnailLarge: {
  //     src: thumbnailLarge.value.url,
  //     width: thumbnailLarge.value.width,
  //     height: thumbnailLarge.value.height,
  //     alt,
  //     title: alt,
  //     orientation,
  //   },
  //   thumbnailSmall: smallThumbnail,
  //   media: [
  //     {
  //       image: smallThumbnail,
  //       parentPermalink: permalink.value,
  //       date: album.date,
  //     },
  //   ],
  //   date: album.date,
  //   albumTitle: album.title,
  //   ...photoMetadata,
  // });
}

async function loadAlbum(
  filePath: string,
  cacheDir: string
): Promise<Result<SourceDataAlbum>> {
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

  if (!rawPhotos) {
    return Err({
      type: "ALBUM_MISSING_PHOTOS",
      path: filePath,
    });
  }

  const images: (SourceDataImage & { featured: boolean })[] = [];

  for (const rawImage of rawPhotos) {
    const result = await loadPhoto({
      path: filePath,
      url: rawImage.url ?? "",
      alt: rawImage.alt ?? "",
      cacheDir,
    });

    if (!result.ok) {
      return result;
    }

    images.push({
      ...result.value,
      featured: rawImage.featured ?? false,
    });
  }

  const tags = rawPhotos.reduce<Set<string>>((acc, photo) => {
    photo.tags?.forEach((tag) => acc.add(tag));
    return acc;
  }, new Set<string>());

  return Ok({
    key: `${title}-${date}`,
    title,
    description: description ?? "",
    content: description ?? "",
    date,
    tags: Array.from(tags),
    coverPhotos: calculateCoverPhotosForAlbum(images),
    images,
  });
}

export async function loadAlbums(
  previousData: SourceDataAlbums,
  albumsDir: string,
  cacheDir: string
): Promise<Result<SourceDataAlbums>> {
  const paths = await getFilesRecursive(albumsDir, ".yml");

  if (!paths.ok) {
    return paths;
  }

  const albums: SourceDataAlbums = { ...previousData };

  for (const filePath of paths.value) {
    const result = await loadAlbum(filePath, cacheDir);

    if (!result.ok) {
      return result;
    }

    albums[result.value.key] = result.value;
  }

  return Ok(albums);
}
