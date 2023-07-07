import fs from "fs-extra";
import md5 from "md5";
// import S3 from "aws-sdk/clients/s3.js";
import config from "../config";
import { Entity, Image, OrderedEntities } from "./types";
import { ProjectError } from "./error";
import imageSize from "image-size";

export const CONTENT_TO_FILTER_OUT =
  /http(s)?:\/\/zoeaubert\.me\/(photos|albums|blog)/;

export type Ok<T> = { ok: true; value: T };

export type Err = { ok: false; error: ProjectError };

export type Result<T> = Ok<T> | Err;

export function Ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function Err(error: ProjectError): Err {
  return { ok: false, error };
}

export function exhaust(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

export async function getImageSize(
  url: string
): Promise<Result<{ width: number; height: number }>> {
  const contentZip = await fetch(url);

  const contentBlob = await contentZip.blob();

  const arrayBuffer = await contentBlob.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const size = imageSize(buffer);

  if (size.width && size.height) {
    return Ok({
      width: size.width,
      height: size.height,
    });
  }

  return Err({
    type: "UNABLE_TO_GET_IMAGE_SIZE",
    url,
  });
}

export function hash(data: {}): string {
  return md5(JSON.stringify(data));
}

export function cleanTag(tag: string): string {
  return tag.replace(/ |-/g, "-");
}

export async function getFilesRecursive(path: string, ext: string) {
  const files = await fs.promises.readdir(path);
  const result: string[] = [];
  for (const file of files) {
    const filePath = `${path}/${file}`;
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      result.push(...(await getFilesRecursive(filePath, ext)));
    } else if (stats.isFile() && filePath.endsWith(ext)) {
      result.push(filePath);
    }
  }
  return result;
}

export function entitiesToOrderedEntities<E extends Entity>(
  entities: E[]
): OrderedEntities<E> {
  const entityOrder = entities
    .sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return bDate.getTime() - aDate.getTime();
    })
    .map((entity) => entity.key);

  const record = entities.reduce<Record<string, E>>((acc, entity) => {
    acc[entity.key] = entity;
    return acc;
  }, {});

  return {
    entities: record,
    entityOrder,
  };
}

export async function exists(path: string): Promise<Result<boolean>> {
  return fs.promises
    .stat(path)
    .then(() => Ok(true))
    .catch(() =>
      Err({
        type: "UNABLE_TO_READ_FILE_SYSTEM",
        url: path,
      })
    );
}

const IMAGE_REGEX = /!\[([^\]]+)\]\(([^\)]+)\)/g;

export async function parseImagesFromMarkdown(
  filePath: string,
  body: string
): Promise<Result<Image[]>> {
  const images: Image[] = [];

  for (const match of body.matchAll(IMAGE_REGEX)) {
    const [, alt, src] = match;

    if (!src) {
      return Err({
        type: "IMAGE_MISSING_SRC",
        url: filePath,
      });
    }

    if (!alt) {
      return Err({
        type: "IMAGE_MISSING_ALT",
        url: filePath,
      });
    }

    const imageSize = await getImageSize(src);

    if (!imageSize.ok) {
      return imageSize;
    }

    const { width, height } = imageSize.value;

    images.push({
      src,
      alt,
      width,
      height,
    });
  }

  return Ok(images);
}

export function formatDateAsSlugPart(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year.toString().padStart(4, "0")}/${month
    .toString()
    .padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
}

export async function downloadAndCacheFile(url: string): Promise<
  Result<{
    cachePath: string;
  }>
> {
  const fileExtension = url.split(".").pop();

  if (!fileExtension) {
    return Err({
      type: "UNABLE_TO_GET_FILE_EXTENSION",
      url,
    });
  }

  const cachePath = `${config.cacheDir}/${hash(url)}.${fileExtension}`;

  if (await exists(cachePath)) {
    return Ok({ cachePath });
  }

  const folder = cachePath.slice(0, cachePath.lastIndexOf("/"));

  if (!(await exists(folder))) {
    await fs.promises.mkdir(folder, { recursive: true });
  }

  const file = await fetch(url);

  if (!file.ok) {
    return Err({
      type: "UNABLE_TO_DOWNLOAD_FILE",
      url,
    });
  }

  const fileContents = await file.blob();

  const arrayBuffer = await fileContents.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.writeFile(cachePath, buffer);

  return Ok({ cachePath });
}

// export const CONTENT_TO_FILTER_OUT =
//   /http(s)?:\/\/zoeaubert\.me\/(photos|albums|blog)/;

// const s3 = new S3({
//   endpoint: `${config.cdn.endpoint}`,
//   accessKeyId: `${config.cdn.key}`,
//   secretAccessKey: `${config.cdn.secret}`,
//   signatureVersion: "v4",
// });

// export function stripDoubleSlashes(url: string): string {
//   return url.replace(/\/\//g, "/");
// }

// export function trimLeadingSlash(url: string): string {
//   return url.replace(/^\//, "");
// }

// export function cleanTag(tag: string): string {
//   return tag.replace(/ |-/g, "-");
// }

// export function formatDateAsSlugPart(date: Date): string {
//   const year = date.getFullYear();
//   const month = date.getMonth() + 1;
//   const day = date.getDate();
//   return `${year.toString().padStart(4, "0")}/${month
//     .toString()
//     .padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
// }

// export async function getFilesRecursive(path: string, ext: string) {
//   const files = await fs.promises.readdir(path);
//   const result: string[] = [];
//   for (const file of files) {
//     const filePath = `${path}/${file}`;
//     const stats = await fs.promises.stat(filePath);
//     if (stats.isDirectory()) {
//       result.push(...(await getFilesRecursive(filePath, ext)));
//     } else if (stats.isFile() && filePath.endsWith(ext)) {
//       result.push(filePath);
//     }
//   }
//   return result;
// }

// export function cdnPathForFileNameAndDate(
//   fileName: string,
//   date: string
// ): string {
//   const cleanedFilePath = fileName.replace(`${config.cacheDir}/`, "");
//   const slugPart = formatDateAsSlugPart(new Date(date));
//   return `/${slugPart}/${cleanedFilePath}`;
// }

// export async function uploadToCDN(
//   filePath: string,
//   url: string,
//   contentType: string | null = null
// ): Promise<ZResult<S3.ManagedUpload.SendData>> {
//   const ContentType =
//     contentType ?? url.endsWith(".jpg") ? "image/jpeg" : "image/png";

//   try {
//     const x = await s3
//       .upload({
//         Bucket: config.cdn.bucket,
//         Key: trimLeadingSlash(stripDoubleSlashes(url)),
//         Body: fs.createReadStream(stripDoubleSlashes(filePath)),
//         ACL: "public-read",
//         ContentType,
//       })
//       .promise();

//     return Ok(x);
//   } catch (e) {
//     return Err({
//       type: "UNABLE_TO_UPLOAD_FILE_TO_CDN",
//       localPath: filePath,
//       uploadPath: url,
//     });
//   }
// }

// // export async function archiveFile(url: string): Promise<string> {}

// export function filterNull<T extends {}>(
//   nullables: (T | null | undefined)[]
// ): T[] {
//   return nullables.filter((v) => v != null) as T[];
// }

// export function recordToArray<K extends string | number | symbol, T extends {}>(
//   record: Record<K, T>
// ): T[] {
//   return filterNull(Object.keys(record).map((key) => record[key as K]));
// }

// export function arrayToRecord<K extends string | number | symbol, T extends {}>(
//   array: T[],
//   key: (value: T) => K
// ): Record<K, T> {
//   return array.reduce((acc, value) => {
//     return {
//       ...acc,
//       [key(value)]: value,
//     };
//   }, {} as Record<K, T>);
// }

// export function sortEntitesByDate(
//   entities: Record<string, Entity>
// ): OrderedEntities {
//   const entityOrder = recordToArray(entities)
//     .map((entity) => entity.id)
//     .sort((a, b) => {
//       const aDate = new Date((entities[a] as any).date);
//       const bDate = new Date((entities[b] as any).date);
//       return bDate.getTime() - aDate.getTime();
//     });
//   return { entityOrder, entities };
// }

// export function filterOrderedEntitiesBy(
//   orderedEntities: OrderedEntities,
//   predicate: (entity: Entity) => boolean
// ): OrderedEntities {
//   let outOrder: OrderedEntities["entityOrder"] = [];
//   let outEntities: OrderedEntities["entities"] = {};

//   for (const id of orderedEntities.entityOrder) {
//     const entity = orderedEntities.entities[id];
//     if (entity && predicate(entity)) {
//       outOrder.push(id);
//       outEntities[id] = entity;
//     }
//   }

//   return { entityOrder: outOrder, entities: outEntities };
// }
