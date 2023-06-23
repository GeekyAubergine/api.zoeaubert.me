import fs from "fs";
import md5 from "md5";
import S3 from "aws-sdk/clients/s3.js";
import config from "../config";
import { Entity, OrderedEntities } from "./types";

export const CONTENT_TO_FILTER_OUT =
  /http(s)?:\/\/zoeaubert\.me\/(photos|albums|blog)/;

const s3 = new S3({
  endpoint: `${config.cdn.endpoint}`,
  accessKeyId: `${config.cdn.key}`,
  secretAccessKey: `${config.cdn.secret}`,
  signatureVersion: "v4",
});

export function exhaust(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

export function stripDoubleSlashes(url: string): string {
  return url.replace(/\/\//g, "/");
}

export function trimLeadingSlash(url: string): string {
  return url.replace(/^\//, "");
}

export function cleanTag(tag: string): string {
  return tag.replace(/ |-/g, "-");
}

export function formatDateAsSlugPart(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year.toString().padStart(4, "0")}/${month
    .toString()
    .padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
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

export async function exists(path: string): Promise<boolean> {
  return fs.promises
    .stat(path)
    .then(() => true)
    .catch(() => false);
}

export function cdnPathForFileNameAndDate(
  fileName: string,
  date: string
): string {
  const cleanedFilePath = fileName.replace(`${config.cacheDir}/`, "");
  const slugPart = formatDateAsSlugPart(new Date(date));
  return `/${slugPart}/${cleanedFilePath}`;
}

export async function uploadToCDN(
  filePath: string,
  url: string,
  contentType: string | null = null
): Promise<any> {
  const ContentType =
    contentType ?? url.endsWith(".jpg") ? "image/jpeg" : "image/png";

  try {
    const x = await s3
      .upload({
        Bucket: config.cdn.bucket,
        Key: trimLeadingSlash(stripDoubleSlashes(url)),
        Body: fs.createReadStream(stripDoubleSlashes(filePath)),
        ACL: "public-read",
        ContentType,
      })
      .promise();

    return x;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function downloadAndCacheFile(url: string): Promise<string> {
  const fileExtension = url.split(".").pop();

  if (!fileExtension) {
    throw new Error(`Failed to get file extension for ${url}`);
  }

  const cachePath = `${config.cacheDir}/${hash(url)}.${fileExtension}`;

  if (await exists(cachePath)) {
    return cachePath;
  }

  const folder = cachePath.slice(0, cachePath.lastIndexOf("/"));

  if (!(await exists(folder))) {
    await fs.promises.mkdir(folder, { recursive: true });
  }

  const file = await fetch(url);

  if (!file.ok) {
    throw new Error(`Failed to download ${url}`);
  }

  const fileContents = await file.blob();

  const arrayBuffer = await fileContents.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.writeFile(cachePath, buffer);

  return cachePath;
}

// export async function archiveFile(url: string): Promise<string> {}

export function hash(data: {}): string {
  return md5(JSON.stringify(data));
}

export function filterNull<T extends {}>(
  nullables: (T | null | undefined)[]
): T[] {
  return nullables.filter((v) => v != null) as T[];
}

export function recordToArray<K extends string | number | symbol, T extends {}>(
  record: Record<K, T>
): T[] {
  return filterNull(Object.keys(record).map((key) => record[key as K]));
}

export function arrayToRecord<K extends string | number | symbol, T extends {}>(
  array: T[],
  key: (value: T) => K
): Record<K, T> {
  return array.reduce((acc, value) => {
    return {
      ...acc,
      [key(value)]: value,
    };
  }, {} as Record<K, T>);
}

export function sortEntitesByDate(
  entities: Record<string, Entity>
): OrderedEntities {
  const entityOrder = recordToArray(entities)
    .map((entity) => entity.id)
    .sort((a, b) => {
      const aDate = new Date((entities[a] as any).date);
      const bDate = new Date((entities[b] as any).date);
      return bDate.getTime() - aDate.getTime();
    });
  return { entityOrder, entities };
}

export function filterOrderedEntitiesBy(
  orderedEntities: OrderedEntities,
  predicate: (entity: Entity) => boolean
): OrderedEntities {
  let outOrder: OrderedEntities["entityOrder"] = [];
  let outEntities: OrderedEntities["entities"] = {};

  for (const id of orderedEntities.entityOrder) {
    const entity = orderedEntities.entities[id];
    if (entity && predicate(entity)) {
      outOrder.push(id);
      outEntities[id] = entity;
    }
  }

  return { entityOrder: outOrder, entities: outEntities };
}
