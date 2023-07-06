import {
  arrayToRecord,
  cdnPathForFileNameAndDate,
  cleanTag,
  CONTENT_TO_FILTER_OUT,
  downloadAndCacheFile,
  hash,
  uploadToCDN,
} from "../utils";
import config from "../../config";
import { Archive, EntityMedia, LoaderParams, MastodonEntity } from "../types";

const URL = `https://social.lol/api/v1/accounts/${config.mastodon.accountId}/statuses?exclude_reblogs=true&exclude_replies=true`;

const REGEX_LINKS = /<a.*?>.*?<\/a>/g;
const REGEX_TAG_LINK = /rel="tag">#<span>(.*?)<\/span>/;
const CONTENT_EMPTY_TAG_REGEX = /<p>\s*<\/p>/g;
const TAGS_TO_FILTER_OUT = ["WarhammerCommunity"];

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

    const cleaned = cleanTag(tag);

    if (TAGS_TO_FILTER_OUT.includes(cleaned)) {
      continue;
    }

    tags.push(cleaned);
  }

  return {
    content: outContent.replace(CONTENT_EMPTY_TAG_REGEX, "").trim(),
    tags,
  };
}

async function processAttachment(
  attachment: any,
  postSlug: string,
  dateString: string
): Promise<EntityMedia> {
  const cached = await downloadAndCacheFile(attachment.url);

  const cdnPath = cdnPathForFileNameAndDate(cached, dateString);

  await uploadToCDN(cached, cdnPath);

  return {
    type: attachment.type,
    url: `${config.cdn.url}${cdnPath}`,
    alt: attachment.description,
    width: attachment.meta?.original?.width,
    height: attachment.meta?.original?.height,
    postSlug,
    date: dateString,
  };
}

async function processToot(
  archive: Archive,
  toot: any
): Promise<MastodonEntity> {
  const date = new Date(toot.created_at);

  const slug = `/micros/${date.getFullYear()}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${toot.id}`;

  const { content, tags } = splitContentAndTags(toot.content);

  const firstLine = content.split("</p>")[0];

  const dateString = new Date(toot.created_at).toISOString();

  const data: Omit<MastodonEntity, "rawDataHash"> = {
    type: "mastodon",
    id: `mastodon-${toot.id}`,
    slug,
    originalUrl: toot.url,
    date: dateString,
    content,
    excerpt: firstLine ? `${firstLine}</p>` : "",
    tags,
    media: toot.media_attachments.map(
      (attachment: any): EntityMedia => ({
        type: attachment.type,
        url: attachment.url,
        alt: attachment.description,
        width: attachment.meta?.original?.width,
        height: attachment.meta?.original?.height,
        postSlug: slug,
        date: dateString,
      })
    ),
  };

  const rawDataHash = hash(data);

  const existingEntity = archive.entities[data.id];

  if (existingEntity && existingEntity.rawDataHash === rawDataHash) {
    return existingEntity as MastodonEntity;
  }

  console.log(`Updating toot: ${data.date}`);

  return {
    ...data,
    rawDataHash,
    media: await Promise.all(
      toot.media_attachments.map((attachment: any) =>
        processAttachment(attachment, slug, dateString)
      )
    ),
  };
}

export async function loadMastadonToots(
  loaderParams: LoaderParams
): Promise<Record<string, MastodonEntity>> {
  try {
    const request = await fetch(URL);
    const data: any = await request.json();
    const rawToots: MastodonEntity[] = await Promise.all(
      data
        .filter(
          (toot: any) =>
            toot.application.name !== "Micro.blog" &&
            toot.application.name !== "status.lol" &&
            CONTENT_TO_FILTER_OUT.test(toot.content) === false
        )
        .map((toot: any) => processToot(loaderParams.archive, toot))
    );

    return arrayToRecord(rawToots, (toot) => toot.id);
  } catch (e) {
    console.error(e);
    return {};
  }
}
