import { arrayToRecord, cleanTag, CONTENT_TO_FILTER_OUT, hash } from "../utils";
import config from "../../config";
import { Archive, EntityMedia, LoaderParams, MastodonEntity } from "../types";

const URL = `https://social.lol/api/v1/accounts/${config.mastodon.accountId}/statuses?exclude_reblogs=true&exclude_replies=true`;

const CONTENT_TAG_REGEX = /<a.*?rel="tag".*?>#<span>(.*?)<\/span><\/a>/g;
const CONTENT_EMPTY_TAG_REGEX = /<p>\s*<\/p>/g;
const TAGS_TO_FILTER_OUT = ["WarhammerCommunity"];

// async function downloadAndStoreMediaFile(
//   url: string,
//   uploadsDir: string
// ): Promise<string> {
//   return "";
// }

// async function downloadAndStoreMedia(
//   toot: MastodonEntity,
//   uploadsDir: string
// ): Promise<MastodonEntity> {
//   const media = toot.media_attachments;

//   if (media.length === 0) {
//     return toot;
//   }

//   return toot;
// }

function splitContentAndTags(content: string): {
  content: string;
  tags: string[];
} {
  const tagsMatch = content.matchAll(CONTENT_TAG_REGEX);

  const outContent = content
    .replace(CONTENT_TAG_REGEX, "")
    .replace(CONTENT_EMPTY_TAG_REGEX, "");

  const tags: string[] = [];

  for (const match of tagsMatch) {
    const [, tag] = match;
    if (!tag) {
      continue;
    }

    const cleaned = cleanTag(tag);

    if (TAGS_TO_FILTER_OUT.includes(cleaned)) {
      continue;
    }

    tags.push(cleaned);
  }

  return {
    content: outContent.trim(),
    tags,
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

  console.log({ content, tags });

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
