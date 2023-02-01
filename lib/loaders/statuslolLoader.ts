import { arrayToRecord, hash } from "../utils";
import fetch from "node-fetch";

import { LoaderParams, StatusLolEntity } from "../types";

const URL = "https://api.omg.lol/address/geekyaubergine/statuses/";

function mapStatusLol(status: any): StatusLolEntity {
  const data: Omit<StatusLolEntity, "rawDataHash"> = {
    type: "statuslol",
    id: status.id,
    url: `https://geekyaubergine.status.lol/${status.id}`,
    date: new Date(status.created * 1000).toISOString(),
    content: status.content,
    emoji: status.emoji,
    media: [],
  };

  const rawDataHash = hash(data);

  return {
    ...data,
    rawDataHash,
  };
}

export async function loadStatusLol(
  _: LoaderParams
): Promise<Record<string, StatusLolEntity>> {
  const request = await fetch(URL);
  const data: any = await request.json();
  const { response } = data;
  const { statuses } = response;

  const mapped: StatusLolEntity[] = statuses.map(mapStatusLol);

  return arrayToRecord(mapped, (status) => status.id);
}
