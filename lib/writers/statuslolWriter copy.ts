import fs from "fs";
import path from "path";
import { Entity } from "../types";

export async function writeMastodon(
  outputDir: string,
  entities: Entity[]
): Promise<void> {
  const archivePath = path.join(outputDir, "mastodon.json");

  const posts = entities.filter((e) => e.type === "mastodon");

  return fs.promises.writeFile(archivePath, JSON.stringify(posts, null, 2));
}
