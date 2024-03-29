import {
  Ok,
  Result,
  entitiesToOrderedEntities,
  fetchUrl,
  formatDateAsSlugPart,
  hash,
} from "../utils";
import { StatusLolEntity, StatusLolPosts } from "../types";

const URL = "https://api.omg.lol/address/geekyaubergine/statuses/";

function mapStatusLol(status: any): StatusLolEntity {
  const rawDataHash = hash(status);

  const date = new Date(status.created * 1000);

  return {
    type: "statusLol",
    key: `statuslol-${status.id}`,
    permalink: `/micros/${formatDateAsSlugPart(date)}/${status.id}`,
    originalUrl: `https://geekyaubergine.status.lol/${status.id}`,
    date: new Date(status.created * 1000).toISOString(),
    content: status.content,
    emoji: status.emoji,
    description: `${status.emoji} ${status.content}`,
    tags: ["Status"],
    rawDataHash,
    media: [],
  };
}

export async function loadStatusLolPosts(): Promise<Result<StatusLolPosts>> {
  const request = await fetchUrl<{
    response: {
      statuses: any[];
    };
  }>(URL);

  if (!request.ok) {
    return request;
  }

  const { response } = request.value;
  const { statuses } = response;

  const mapped: StatusLolEntity[] = statuses.map(mapStatusLol);

  return Ok(entitiesToOrderedEntities(mapped));
}
