import fs from "fs";
import { archiveEntitiesOfTypeInOrder } from "../utils";
import path from "path";
import { Archive } from "../types";

export async function writeMastodon(
  outputDir: string,
  archive: Archive
): Promise<void> {
  const archivePath = path.join(outputDir, "mastodon.json");

  const toots = archiveEntitiesOfTypeInOrder(archive, "mastodon");

  return fs.promises.writeFile(archivePath, JSON.stringify(toots, null, 2));
}
