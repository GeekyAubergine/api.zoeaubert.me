import {
  Ok,
  Result,
  cdnPathForFileNameAndDate,
  cleanTags,
  contentContainsContentToFilterOut,
  downloadAndCacheFile,
  orderedEntitesFromArray,
  fetchUrl,
  getImageOrientation,
  hash,
  uploadToCDN,
} from "../utils";
import config from "../../config";
import {
  DataImage,
  EntityMedia,
  MastodonPostEntity,
  MastodonPosts,
  SourceDataImage,
} from "../types";
import { SourceData } from "./loaders";

const URL = `https://social.lol/api/v1/accounts/${config.mastodon.accountId}/statuses?exclude_reblogs=true&exclude_replies=true&limit=40`;

const REGEX_LINKS = /<a.*?>.*?<\/a>/g;
const REGEX_TAG_LINK = /rel="tag">#<span>(.*?)<\/span>/;
const CONTENT_EMPTY_TAG_REGEX = /<p>\s*<\/p>/g;

export type SourceDataMastodonPost = {
  key: string;
  originalUrl: string;
  date: string;
  content: string;
  description: string;
  tags: string[];
  images: SourceDataImage[];
};

export type SourceDataMastodonPosts = Record<string, SourceDataMastodonPost>;

export const DEFAULT_SOURCE_DATA_MASTODON_POSTS: SourceDataMastodonPosts = {};

function splitContentAndTags(content: string): {
  content: string;
  tags: string[];
} {
  const linksMatch = content.matchAll(REGEX_LINKS);

  let outContent = content;

  const tags: string[] = [];

  for (const match of linksMatch) {
    const [fullMatch] = match;

    const tagsMatch = fullMatch.match(REGEX_TAG_LINK);

    if (!tagsMatch) {
      continue;
    }

    const [, tag] = tagsMatch;
    if (!tag) {
      continue;
    }

    outContent = outContent.replace(fullMatch, "");

    tags.push(tag);
  }

  return {
    content: outContent.replace(CONTENT_EMPTY_TAG_REGEX, "").trim(),
    tags: cleanTags(tags),
  };
}
async function processAttachment(
  attachment: {
    url: string;
    description: string;
    meta: { original: { width: number; height: number } };
  },
  dateString: string,
  cacheDir: string
): Promise<Result<SourceDataImage>> {
  const cachedResult = await downloadAndCacheFile(attachment.url, cacheDir);

  if (!cachedResult.ok) {
    return cachedResult;
  }

  const cdnPath = cdnPathForFileNameAndDate(
    cachedResult.value.cachePath,
    dateString,
    cacheDir,
  );

  const uploadResult = await uploadToCDN(cachedResult.value.cachePath, cdnPath, cacheDir);

  if (!uploadResult.ok) {
    return uploadResult;
  }

  return Ok({
    src: `${config.cdn.url}${cdnPath}`,
    alt: attachment.description,
    width: attachment.meta.original.width,
    height: attachment.meta.original.height,
    orientation: getImageOrientation(
      attachment.meta.original.width,
      attachment.meta.original.height
    ),
  });
}

async function processToot(
  toot: any,
  cacheDir: string
): Promise<Result<SourceDataMastodonPost>> {
  const key = `mastodon-${toot.id}`;

  // const slug = `/micros/${date.getFullYear()}/${(date.getMonth() + 1)
  //   .toString()
  //   .padStart(2, "0")}/${toot.id}`;

  const { content, tags } = splitContentAndTags(toot.content);

  const firstLine = content.split("</p>")[0];

  const dateString = new Date(toot.created_at).toISOString();

  const images: SourceDataImage[] = [];

  for (const attachment of toot.media_attachments) {
    const result = await processAttachment(attachment, dateString, cacheDir);

    if (!result.ok) {
      return result;
    }

    images.push(result.value);
  }

  return Ok({
    key,
    originalUrl: toot.url,
    date: dateString,
    content,
    description: firstLine ? `${firstLine}</p>` : "",
    tags: cleanTags(tags),
    images,
  });
}

async function fetchAllToots(): Promise<Result<any[]>> {
  let toots: any[] = [];

  let maxId: string | undefined;

  while (true) {
    const url = `${URL}${maxId ? `&max_id=${maxId}` : ""}`;

    const result = await fetchUrl<any[]>(url);

    if (!result.ok) {
      return result;
    }

    const data = result.value;

    if (!data.length) {
      break;
    }

    toots = toots.concat(data);

    maxId = data[data.length - 1].id;
  }

  return Ok(toots);
}

export async function loadMastodonPosts(
  previousData: SourceDataMastodonPosts,
  cacheDir: string
): Promise<Result<SourceDataMastodonPosts>> {
  const tootsResponse = await fetchAllToots();

  if (!tootsResponse.ok) {
    return tootsResponse;
  }

  const toots = { ...previousData };

  for (const toot of tootsResponse.value) {
    if (
      toot.application?.name === "Micro.blog" ||
      toot.application?.name === "status.lol" ||
      contentContainsContentToFilterOut(toot.content)
    ) {
      continue;
    }

    const tootResult = await processToot(toot, cacheDir);

    if (!tootResult.ok) {
      return tootResult;
    }

    toots[tootResult.value.key] = tootResult.value;
  }

  return Ok(toots);
}
