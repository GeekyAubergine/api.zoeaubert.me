import path from "path";
import { Result, writeJSONFile } from "../utils";
import Data from "../types";

const RECENT_GAMES_COUNT = 3;

export async function writeGames(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const { games } = data;

  const outputPath = path.join(outputDir, "games.json");

  const gameKeys = Object.keys(games);

  const keysByPlaytime = gameKeys.slice().sort((a, b) => {
    const gameA = games[a]!;
    const gameB = games[b]!;

    return gameB.playtime.minutes - gameA.playtime.minutes;
  });

  const keysByLastPlayed = gameKeys
    .slice()
    .sort((a, b) => {
      const gameA = games[a]!;
      const gameB = games[b]!;

      return gameB.lastPlayed.timestamp - gameA.lastPlayed.timestamp;
    })
    .slice(0, RECENT_GAMES_COUNT);

  const totalPlaytimeMinutes = Object.values(games).reduce(
    (total, game) => total + game.playtime.minutes,
    0
  );

  const totalPlaytime = parseFloat((totalPlaytimeMinutes / 60).toFixed(1))

  const out = {
    games,
    keysByPlaytime,
    keysByLastPlayed,
    totalPlaytime,
  };

  return writeJSONFile(outputPath, out);
}
