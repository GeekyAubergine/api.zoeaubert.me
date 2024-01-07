import { Ok, Result, fetchUrl } from "../utils";

const URL = "https://api.omg.lol/address/geekyaubergine/statuses/";

export type SourceDataStatusLolPost = {
  id: string;
  originalUrl: string;
  date: string;
  content: string;
  emoji: string;
};

export type SourceDataStatusLol = Record<string, SourceDataStatusLolPost>;

export const DEFAULT_SOURCE_DATA_STATUS_LOL: SourceDataStatusLol = {};

function mapStatusLol(status: any): SourceDataStatusLolPost {
  return {
    id: status.id,
    // permalink: `/micros/${formatDateAsSlugPart(date)}/${status.id}`,
    originalUrl: `https://geekyaubergine.status.lol/${status.id}`,
    date: new Date(status.created * 1000).toISOString(),
    content: status.content,
    emoji: status.emoji,
  };
}

export async function loadStatusLolPosts(
  previousData: SourceDataStatusLol
): Promise<Result<SourceDataStatusLol>> {
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

  const mapped: SourceDataStatusLolPost[] = statuses.map(mapStatusLol);

  const statusLolPosts = mapped.reduce<SourceDataStatusLol>((acc, status) => {
    acc[status.id] = status;
    return acc;
  }, previousData);

  return Ok(statusLolPosts);
}
