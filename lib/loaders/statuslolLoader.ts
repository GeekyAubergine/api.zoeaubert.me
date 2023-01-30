import fetch from "node-fetch";

import { StatusLolEntity } from "../types";

const URL = "https://api.omg.lol/address/geekyaubergine/statuses/";

export async function loadStatusLol(): Promise<StatusLolEntity[]> {
  const request = await fetch(URL);
  const data: any = await request.json();
  const { response } = data;
  const { statuses } = response;
  return statuses.map((status: any) => ({
    type: "statuslol",
    id: status.id,
    url: `https://geekyaubergine.status.lol/${status.id}`,
    date: new Date(status.created * 1000),
    content: status.content,
    emoji: status.emoji,
  }));
}
