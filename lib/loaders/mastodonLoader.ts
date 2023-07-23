import {
  Ok,
  Result,
  cdnPathForFileNameAndDate,
  cleanTags,
  contentContainsContentToFilterOut,
  downloadAndCacheFile,
  entitiesToOrderedEntities,
  fetchUrl,
  getImageOrientation,
  hash,
  uploadToCDN,
} from "../utils";
import config from "../../config";
import {
  EntityMedia,
  LoaderParams,
  MastodonPostEntity,
  MastodonPosts,
} from "../types";

const URL = `https://social.lol/api/v1/accounts/${config.mastodon.accountId}/statuses?exclude_reblogs=true&exclude_replies=true&limit=40`;

const REGEX_LINKS = /<a.*?>.*?<\/a>/g;
const REGEX_TAG_LINK = /rel="tag">#<span>(.*?)<\/span>/;
const CONTENT_EMPTY_TAG_REGEX = /<p>\s*<\/p>/g;

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
  postPermalink: string,
  dateString: string
): Promise<Result<EntityMedia>> {
  const cachedResult = await downloadAndCacheFile(attachment.url);

  if (!cachedResult.ok) {
    return cachedResult;
  }

  const cdnPath = cdnPathForFileNameAndDate(
    cachedResult.value.cachePath,
    dateString
  );

  const uploadResult = await uploadToCDN(cachedResult.value.cachePath, cdnPath);

  if (!uploadResult.ok) {
    return uploadResult;
  }

  return Ok({
    image: {
      src: `${config.cdn.url}${cdnPath}`,
      alt: attachment.description,
      width: attachment.meta.original.width,
      height: attachment.meta.original.height,
      title: attachment.description,
      orientation: getImageOrientation(
        attachment.meta.original.width,
        attachment.meta.original.height
      ),
    },
    parentPermalink: postPermalink,
    date: dateString,
  });
}

async function processToot(
  loaderParams: LoaderParams<MastodonPostEntity>,
  toot: any
): Promise<Result<MastodonPostEntity>> {
  const key = `mastodon-${toot.id}`;

  const hashable = {
    date: toot.created_at,
    content: toot.content,
    tags: toot.tags,
    media: toot.media_attachments,
    originalUrl: toot.url,
  };

  const rawDataHash = hash(hashable);

  const existing = loaderParams.orderedEntities.entities[key];

  if (existing && existing.rawDataHash === rawDataHash) {
    return Ok(existing);
  }

  const date = new Date(toot.created_at);

  const slug = `/micros/${date.getFullYear()}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${toot.id}`;

  const { content, tags } = splitContentAndTags(toot.content);

  const firstLine = content.split("</p>")[0];

  const dateString = new Date(toot.created_at).toISOString();

  const media: EntityMedia[] = [];

  for (const attachment of toot.media_attachments) {
    const result = await processAttachment(attachment, slug, dateString);

    if (!result.ok) {
      return result;
    }

    media.push(result.value);
  }

  console.log(`Updating toot ${key}`);

  return Ok({
    type: "mastodon",
    key,
    permalink: slug,
    originalUrl: toot.url,
    date: dateString,
    content,
    description: firstLine ? `${firstLine}</p>` : "",
    tags: cleanTags(tags),
    media,
    rawDataHash,
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
  loaderParams: LoaderParams<MastodonPostEntity>
): Promise<Result<MastodonPosts>> {
  const tootsResponse = await fetchAllToots();

  if (!tootsResponse.ok) {
    return tootsResponse;
  }

  const entities: MastodonPostEntity[] = [];

  for (const toot of tootsResponse.value) {
    if (
      toot.application?.name === "Micro.blog" ||
      toot.application?.name === "status.lol" ||
      contentContainsContentToFilterOut(toot.content)
    ) {
      continue;
    }

    const entityResult = await processToot(loaderParams, toot);

    if (!entityResult.ok) {
      return entityResult;
    }

    entities.push(entityResult.value);
  }

  return Ok(entitiesToOrderedEntities(entities));
}
