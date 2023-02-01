import { arrayToRecord, hash } from "../utils";
import fetch from "node-fetch";
import config from "../../config";
import { Archive, LoaderParams, MastodonEntity } from "../types";

const CONTENT_TO_FILTER_OUT = /https:\/\/zoeaubert.me/;

const URL = `https://social.lol//api/v1/accounts/${config.mastodon.accountId}/statuses?exclude_reblogs=true&exclude_replies=true`;

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

function cleanContent(content: string): string {
  const match = content.match(/<p.*?>.*?<\/p>/g);

  if (!match) {
    return content;
  }

  const paragraphs = match.filter(
    (paragraph) => !paragraph.includes('rel="tag"')
  );

  return paragraphs.join("");
}

async function processToot(
  archive: Archive,
  toot: any
): Promise<MastodonEntity> {
  const date = new Date(toot.created_at);

  const url = `/${date.getFullYear()}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${toot.id}`;

  const data: Omit<MastodonEntity, "rawDataHash"> = {
    type: "mastodon",
    id: toot.id,
    url,
    date: new Date(toot.created_at).toISOString(),
    content: cleanContent(toot.content).trim(),
    tags: toot.tags.map((tag: any) => tag.name),
    media: toot.media_attachments.map((attachment: any) => ({
      url: attachment.url,
      alt: attachment.description,
    })),
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
}
