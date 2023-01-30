import fs from "fs";
import path from "path";
import { Entity } from "../types";

export async function writeStatuslol(
  outputDir: string,
  entities: Entity[]
): Promise<void> {
  const archivePath = path.join(outputDir, "statuslol.json");

  const posts = entities.filter((e) => e.type === "statuslol");

  return fs.promises.writeFile(archivePath, JSON.stringify(posts, null, 2));
}
