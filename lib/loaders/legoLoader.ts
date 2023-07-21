import { Err, Ok, Result } from "../utils";

import config from "../../config";
import { Lego, LegoSet, LegoSets } from "../types";

const LOGIN_URL = "https://brickset.com/api/v3.asmx/login";
const GET_SET_URL = "https://brickset.com/api/v3.asmx/getSets";

async function fetchUserHash(): Promise<Result<string>> {
  try {
    const loginResponse = await fetch(
      `${LOGIN_URL}?apiKey=${config.brickset.apiKey}&username=${config.brickset.username}&password=${config.brickset.password}`
    );

    const loginData = await loginResponse.json();

    return Ok(loginData.hash);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_FETCH_URL",
      url: LOGIN_URL,
    });
  }
}

async function fetchSets(userHash: string): Promise<Result<any>> {
  try {
    const getSetsResponse = await fetch(
      `${GET_SET_URL}?apiKey=${config.brickset.apiKey}&userHash=${userHash}&params={"owned":1}`
    );

    const getSetsData = await getSetsResponse.json();

    return Ok(getSetsData);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_FETCH_URL",
      url: GET_SET_URL,
    });
  }
}

export async function loadLegoSets(): Promise<Result<Lego>> {
  const userHashResult = await fetchUserHash();

  if (!userHashResult.ok) {
    return userHashResult;
  }

  const setsResult = await fetchSets(userHashResult.value);

  if (!setsResult.ok) {
    return setsResult;
  }

  const rawSets = setsResult.value.sets;

  const sets: LegoSets = {};

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

    sets[set.key] = set;
  }

  console.log({ sets })

  const setKeys = Object.keys(sets).sort((a, b) => {
    const setA = sets[a]!;
    const setB = sets[b]!;

    return setB.pieces - setA.pieces;
  });

  const totalPieces = Object.values(sets).reduce(
    (total, set) => total + set.pieces * set.quantity,
    0
  );

  return Ok({
    sets,
    setKeys,
    totalPieces,
  });
}
