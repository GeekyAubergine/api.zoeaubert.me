import { Ok, Result, fetchUrl } from "../utils";

import config from "../../config";
import { DataGame } from "lib/types";

const GAMES_URL =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&include_appinfo=true";

export type SourceDataGames = Record<string, DataGame>;

export const DEFAULT_SOURCE_DATA_GAMES: SourceDataGames = {};

export async function loadGames(previousGames: SourceDataGames): Promise<Result<SourceDataGames>> {
  const gamesResult = await fetchUrl<any>(
    `${GAMES_URL}&key=${config.steam.apiKey}&steamid=${config.steam.steamId}`
  );

  if (!gamesResult.ok) {
    return gamesResult;
  }

  const games: SourceDataGames = previousGames;

  for (const rawGame of gamesResult.value.response.games) {
    const game: DataGame = {
      appid: rawGame.appid,
      name: rawGame.name,
      played: rawGame.playtime_forever > 0,
      playtime: {
        minutes: rawGame.playtime_forever,
        hours: parseFloat((rawGame.playtime_forever / 60).toFixed(1)),
      },
      lastPlayed: {
        timestamp: rawGame.rtime_last_played,
        date: new Date(rawGame.rtime_last_played * 1000).toISOString(),
      },
      link: `https://store.steampowered.com/app/${
        rawGame.appid
      }/${rawGame.name.replace(/ /g, "_")}`,
      headerImage: {
        src: `https://steamcdn-a.akamaihd.net/steam/apps/${rawGame.appid}/header.jpg`,
      },
    };

    games[game.appid] = game;
  }

  return Ok(games);
}
