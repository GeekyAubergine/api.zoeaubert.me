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

  return writeFile(archivePath, JSON.stringify(ordered, null, 2));
}
