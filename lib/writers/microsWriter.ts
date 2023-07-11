import path from "path";
import { Result, mergeOrderedEntities, writeFile } from "../utils";
import Archive, {
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  StatusLolEntity,
} from "../types";

export async function writeMicros(
  outputDir: string,
  archive: Archive
): Promise<Result<undefined>> {
  const archivePath = path.join(outputDir, "micros.json");

  const entites = [
    archive.microPosts,
    archive.mastodonPosts,
    archive.statusLolPosts,
    archive.microBlogsPosts,
  ];

  const ordered = mergeOrderedEntities<
    MicroPostEntity | MastodonPostEntity | StatusLolEntity | MicroBlogEntity
  >(entites);
  
  const out = {
    ...ordered,
    recent: ordered.entityOrder.slice(0, 5),
  }

  return writeFile(archivePath, JSON.stringify(out, null, 2));
}
