import { Ok, Result, fetchUrl } from "../utils";

import config from "../../config";

const LOGIN_URL = "https://brickset.com/api/v3.asmx/login";
const GET_SET_URL = "https://brickset.com/api/v3.asmx/getSets";

export type LegoSet = {
  key: string;
  name: string;
  number: string;
  pieces: number;
  image: {
    src: string;
  };
  thumbnail: {
    src: string;
  };
  bricksetUrl: string;
  quantity: number;
};

export type SourceDataLego = {
  sets: Record<string, LegoSet>;
};

export const DEFAULT_SOURCE_DATA_LEGO: SourceDataLego = {
  sets: {}
};

async function fetchUserHash(): Promise<Result<string>> {
  const loginResponse = await fetchUrl<{
    hash: string;
  }>(
    `${LOGIN_URL}?apiKey=${config.brickset.apiKey}&username=${config.brickset.username}&password=${config.brickset.password}`
  );

  if (!loginResponse.ok) {
    return loginResponse;
  }

  return Ok(loginResponse.value.hash);
}

export async function loadLegoSets(
  previousData: SourceDataLego
): Promise<Result<SourceDataLego>> {
  const userHashResult = await fetchUserHash();

  if (!userHashResult.ok) {
    return userHashResult;
  }

  const setsResult = await fetchUrl<any>(
    `${GET_SET_URL}?apiKey=${config.brickset.apiKey}&userHash=${userHashResult.value}&params={"owned":1, "pageSize": 500}`
  );

  if (!setsResult.ok) {
    return setsResult;
  }

  const rawSets = setsResult.value.sets;

  const lego = { ...previousData };

  for (const rawSet of rawSets) {
    const set: LegoSet = {
      key: rawSet.setID,
      name: rawSet.name,
      number: rawSet.number,
      pieces: rawSet.pieces ?? 1,
      image: {
        src: rawSet.image.imageURL,
      },
      thumbnail: {
        src: rawSet.image.thumbnailURL,
      },
      bricksetUrl: rawSet.bricksetURL,
      quantity: rawSet.collection.qtyOwned,
    };

    lego.sets[set.key] = set;
  }
  return Ok(lego);
}
