import path from "path";
import { Result, mergeOrderedEntities, writeJSONFile } from "../utils";
import {
  Data,
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  StatusLolEntity,
} from "../types";

export async function writeMicros(
  outputDir: string,
  data: Data
): Promise<Result<undefined>> {
  const outputPath = path.join(outputDir, "micros.json");

  const entites = [
    data.microPosts,
    data.mastodonPosts,
    data.statusLolPosts,
    data.microBlogsPosts,
  ];

  const ordered = mergeOrderedEntities<
    MicroPostEntity | MastodonPostEntity | StatusLolEntity | MicroBlogEntity
  >(entites);
  
  const out = {
    ...ordered,
    recent: ordered.entityOrder.slice(0, 5),
  }

  return writeJSONFile(outputPath, out);
}
