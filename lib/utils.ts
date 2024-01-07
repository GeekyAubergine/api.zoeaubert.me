import fs from "fs-extra";
import path from "path";
import md5 from "md5";
import S3 from "aws-sdk/clients/s3.js";
import config from "../config";
import {
  Entity,
  SourceDataImage,
  ImageOrientation,
  OrderedEntities,
} from "./types";
import { ProjectError } from "./error";
import imageSize from "image-size";
import frontMatterParser from "front-matter";

const TAGS_TO_FILTER_OUT = ["WarhammerCommunity"];

export const CONTENT_TO_FILTER_OUT =
  /http(s)?:\/\/zoeaubert\.me\/(photos|albums|blog|battle-report)/;

const s3 = new S3({
  endpoint: `${config.cdn.endpoint}`,
  accessKeyId: `${config.cdn.key}`,
  secretAccessKey: `${config.cdn.secret}`,
  signatureVersion: "v4",
});

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type Ok<T> = { ok: true; value: T };

export type Err = { ok: false; error: ProjectError };

export type Result<T> = Ok<T> | Err;

export function Ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function Err(error: ProjectError): Err {
  return { ok: false, error };
}

export function filterOk<T>(results: Result<T>[]): T[] {
  return results
    .filter((result) => result.ok)
    .map((result: Ok<T>) => result.value) as T[];
}

export function filterErr<T>(results: Result<T>[]): ProjectError[] {
  return results
    .filter((result) => !result.ok)
    .map((result: Err) => result.error);
}

export function exhaust(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

export async function fetchUrl<T>(url: string): Promise<Result<T>> {
  try {
    const request = await fetch(url);

    const json = await request.json();

    return Ok(json);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_FETCH_URL",
      url,
    });
  }
}

export async function postUrl<T>(url: string, body: any): Promise<Result<T>> {
  try {
    let requestInfo: {
      method: string;
      body: string | null;
    } = {
      method: "POST",
      body: null,
    };

    if (body != null) {
      requestInfo.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const request = await fetch(url, requestInfo);

    const json = await request.json();

    return Ok(json);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_FETCH_URL",
      url,
    });
  }
}

export async function getImageSize(
  url: string
): Promise<Result<{ width: number; height: number }>> {
  try {
    // const contentZip = await fetch(url);

    // const contentBlob = await contentZip.blob();

    // const arrayBuffer = await contentBlob.arrayBuffer();

    // const buffer = Buffer.from(arrayBuffer);

    const size = imageSize(url);

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
  } catch (e) {
    return Err({
      type: "UNABLE_TO_GET_IMAGE_SIZE",
      url,
    });
  }
}

export function getImageOrientation(
  width: number,
  height: number
): ImageOrientation {
  if (width > height) {
    return "landscape";
  }

  if (height > width) {
    return "portrait";
  }

  return "square";
}

export function hash(data: {}): string {
  return md5(JSON.stringify(data));
}

function cleanTag(tag: string): string {
  return tag.replace(/ |-/g, "-");
}

export function cleanTags(tags: string[] | null | undefined): string[] {
  return (tags ?? [])
    .map(cleanTag)
    .filter((tag) => !TAGS_TO_FILTER_OUT.includes(tag));
}

export async function getFilesRecursive(
  path: string,
  ext: string
): Promise<Result<string[]>> {
  try {
    const files = await fs.promises.readdir(path);

    const result: string[] = [];
    for (const file of files) {
      const filePath = `${path}/${file}`;

      try {
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
          const getFilesRecursiveResult = await getFilesRecursive(
            filePath,
            ext
          );

          if (!getFilesRecursiveResult.ok) {
            return getFilesRecursiveResult;
          }

          result.push(...getFilesRecursiveResult.value);
        } else if (stats.isFile() && filePath.endsWith(ext)) {
          result.push(filePath);
        }
      } catch (e) {
        return Err({
          type: "COULD_NOT_READ_FILE_STATS",
          path: filePath,
        });
      }
    }

    return Ok(result);
  } catch (e) {
    return Err({
      type: "COULD_NOT_READ_ADDRESS",
      path,
    });
  }
}

export function orderedEntitesFromArray<
  E extends { key: string; date: string }
>(
  entities: E[]
): {
  entities: Record<string, E>;
  entityOrder: string[];
} {
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

export function orderedEntitesFromObject<
  E extends { key: string; date: string }
>(
  entities: Record<string, E>
): {
  entities: Record<string, E>;
  entityOrder: string[];
} {
  return orderedEntitesFromArray(Object.values(entities));
}

export async function exists(path: string): Promise<Result<boolean>> {
  try {
    const stat = await fs.exists(path);

    return Ok(stat);
  } catch (error) {
    return Err({
      type: "UNABLE_TO_READ_FILE_SYSTEM",
      url: path,
    });
  }
}

export async function makeFolder(path: string): Promise<Result<undefined>> {
  try {
    const pubDirExists = await exists(path);

    if (!pubDirExists.ok || !pubDirExists.value) {
      await fs.promises.mkdir(path, { recursive: true });
    }

    return Ok(undefined);
  } catch (error) {
    return Err({
      type: "UNABLE_TO_MAKE_FOLDER",
      path,
    });
  }
}

const IMAGE_REGEX = /!\[([^\]]+)\]\(([^\)]+)\)/g;

export async function parseImagesFromMarkdown({
  filePath,
  body,
  cacheDir,
}: {
  filePath: string;
  body: string;
  cacheDir: string;
}): Promise<Result<SourceDataImage[]>> {
  const images: SourceDataImage[] = [];

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

    const cacheResult = await downloadAndCacheFile(src, cacheDir);

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

    images.push({
      src,
      alt,
      width: imageSize.value.width,
      height: imageSize.value.height,
      orientation,
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

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export async function downloadAndCacheFile(
  url: string,
  cacheDir: string
): Promise<
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

  const cachePath = `${cacheDir}/${hash(url)}.${fileExtension}`;

  const cacheExists = await exists(cachePath);

  if (!cacheExists.ok) {
    return cacheExists;
  }

  if (cacheExists.value) {
    return Ok({ cachePath });
  }

  const dirname = path.dirname(cachePath);

  const makeFolderResult = await makeFolder(dirname);

  if (!makeFolderResult.ok) {
    return makeFolderResult;
  }

  console.log(`Downloading ${url}`);

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

  try {
    await fs.promises.writeFile(cachePath, buffer);

    return Ok({ cachePath });
  } catch (e) {
    return Err({
      type: "UNABLE_TO_WRITE_FILE",
      path: cachePath,
    });
  }
}

export function cdnPathForFileNameAndDate(
  fileName: string,
  date: string,
  cacheDir: string
): string {
  const cleanedFilePath = fileName.replace(`${cacheDir}/`, "");
  const slugPart = formatDateAsSlugPart(new Date(date));
  return stripDoubleSlashes(`/${slugPart}/${cleanedFilePath}`);
}

function stripDoubleSlashes(url: string): string {
  return url.replace(/\/\//g, "/");
}

function trimLeadingSlash(url: string): string {
  return url.replace(/^\//, "");
}

export async function fileExistsOnCDN(
  url: string,
  cacheDir: string
): Promise<Result<boolean>> {
  const cleanedUrl = trimLeadingSlash(
    stripDoubleSlashes(url.replace(`${cacheDir}/`, ""))
  );

  try {
    await s3
      .headObject({ Bucket: config.cdn.bucket, Key: cleanedUrl })
      .promise();
    // File already exists
    return Ok(true);
  } catch (e) {
    // Do nothing as this just means the file doesn't exist
  }

  return Ok(false);
}

export async function uploadToCDN(
  filePath: string,
  url: string,
  cacheDir: string
): Promise<Result<undefined>> {
  const ContentType = url.endsWith(".jpg") ? "image/jpeg" : "image/png";

  const fileExistsOnCDNResult = await fileExistsOnCDN(url, cacheDir);

  if (!fileExistsOnCDNResult.ok) {
    return fileExistsOnCDNResult;
  }

  if (fileExistsOnCDNResult.value) {
    return Ok(undefined);
  }

  try {
    console.log(`Uploading ${url}`);

    await s3
      .upload({
        Bucket: config.cdn.bucket,
        Key: trimLeadingSlash(stripDoubleSlashes(url)),
        Body: fs.createReadStream(stripDoubleSlashes(filePath)),
        ACL: "public-read",
        ContentType,
      })
      .promise();

    return Ok(undefined);
  } catch (e) {
    if (e.code === "ENOENT") {
      return Err({
        type: "UNABLE_TO_READ_FILE",
        path: filePath,
      });
    }

    return Err({
      type: "UNABLE_TO_UPLOAD_FILE_TO_CDN",
      localPath: filePath,
      uploadPath: url,
    });
  }
}

export async function readFile(path: string): Promise<Result<string>> {
  try {
    const fileContents = await fs.readFile(path, "utf-8");

    return Ok(fileContents);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_READ_FILE",
      path,
    });
  }
}

export async function readMarkdownFile(path: string): Promise<Result<string>> {
  const fileContents = await readFile(path);

  if (!fileContents.ok) {
    return fileContents;
  }

  const frontMatter = frontMatterParser(fileContents.value);

  return Ok(frontMatter.body);
}

export function parseJson<T>(json: string, description: string): Result<T> {
  try {
    const parsed = JSON.parse(json);

    return Ok(parsed);
  } catch (e) {
    return Err({
      type: "COULD_NOT_PARSE_JSON",
      description,
    });
  }
}

export async function writeFile(
  path: string,
  contents: string
): Promise<Result<undefined>> {
  try {
    await fs.writeFile(path, contents);

    return Ok(undefined);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_WRITE_FILE",
      path,
    });
  }
}

export async function writeJSONFile(
  path: string,
  contents: {}
): Promise<Result<undefined>> {
  const json = JSON.stringify(contents, null, 2);

  return writeFile(path, json);
}

export function mergeOrderedEntities<T extends Entity>(
  orderedEntities: OrderedEntities<T>[]
): OrderedEntities<T> {
  const entities: T[] = [];

  for (const orderedEntity of orderedEntities) {
    for (const key of orderedEntity.entityOrder) {
      let entity = orderedEntity.entities[key];
      if (entity) {
        entities.push(entity);
      }
    }
  }

  return orderedEntitesFromArray(entities);
}

export function contentContainsContentToFilterOut(content: string): boolean {
  return CONTENT_TO_FILTER_OUT.test(content);
}
