import fs from "fs";
import { archiveEntitiesOfTypeInOrder } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeStatuslol(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "statuslol.json");

  const statuses = archiveEntitiesOfTypeInOrder(archive, "statuslol");

  return fs.promises.writeFile(archivePath, JSON.stringify(statuses, null, 2));
}
