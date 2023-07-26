import path from "path";
import { Result, writeJSONFile } from "../utils";
import { Data } from "../types";

export async function writeLego(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const { lego } = data;

  const outputPath = path.join(outputDir, "lego.json");

  const setKeys = Object.keys(lego).sort((a, b) => {
    const setA = lego[a]!;
    const setB = lego[b]!;

    return setB.pieces - setA.pieces;
  });

  const totalPieces = Object.values(lego).reduce(
    (total, set) => total + set.pieces * set.quantity,
    0
  );

  const out = {
    sets: lego,
    setKeys,
    totalPieces,
  };

  return writeJSONFile(outputPath, out);
}
