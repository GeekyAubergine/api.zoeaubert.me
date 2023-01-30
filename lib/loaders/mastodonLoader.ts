import fetch from "node-fetch";
import config from "../../config";
import { MastodonEntity } from "../types";

const URL = `https://social.lol//api/v1/accounts/${config.mastodon.accountId}/statuses`;

export async function loadMastadonToots(): Promise<MastodonEntity[]> {
  const request = await fetch(URL);
  const data: any = await request.json();
  return data
    .filter(
      (toot: any) =>
        toot.application.name !== "Micro.blog" &&
        toot.application.name !== "status.lol" &&
        toot.in_reply_to_id === null
    )
    .map((toot: any) => ({
      type: "mastodon",
      id: toot.id,
      url: toot.url,
      date: new Date(toot.created_at),
      content: toot.content,
      tags: toot.tags.map((tag: any) => tag.name),
    }));
}
