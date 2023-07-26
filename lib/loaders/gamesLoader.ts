import { Ok, Result, fetchUrl } from "../utils";

import config from "../../config";
import { Game, Games } from "../types";

const GAMES_URL =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&include_appinfo=true";

export async function loadGames(): Promise<Result<Games>> {
  const gamesResult = await fetchUrl<any>(
    `${GAMES_URL}&key=${config.steam.apiKey}&steamid=${config.steam.steamId}`
  );

  if (!gamesResult.ok) {
    return gamesResult;
  }

  const games: Games = {};

  for (const rawGame of gamesResult.value.response.games) {
    const game: Game = {
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
