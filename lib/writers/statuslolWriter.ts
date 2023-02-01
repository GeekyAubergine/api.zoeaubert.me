import fs from "fs";
import { filterOrderedEntitiesBy } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeStatuslol(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "statuslol.json");

  const out = filterOrderedEntitiesBy(
    archive,
    (entity) => entity.type === "statuslol"
  );

  return fs.promises.writeFile(archivePath, JSON.stringify(out, null, 2));
}
