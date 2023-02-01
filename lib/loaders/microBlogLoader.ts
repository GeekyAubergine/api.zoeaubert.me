import fs from "fs";
import { arrayToRecord, hash } from "../utils";

import { LoaderParams, MicroBlogEntity } from "../types";

function mapMicroBlog(microBlog: any): MicroBlogEntity {
  const url = microBlog.id.replace(
    "http://geekyaubergine.micro.blog/",
    "/micros/"
  );
  const data: Omit<MicroBlogEntity, "rawDataHash"> = {
    type: "microblog",
    id: url,
    url,
    date: new Date(microBlog.date_published).toISOString(),
    content: microBlog.content_text.replace(
      /uploads\//g,
      "https://cdn.geekyaubergine.com/"
    ),
    media: [],
    tags: microBlog.tags ?? [],
  };

  const rawDataHash = hash(data);

  return {
    ...data,
    rawDataHash,
  };
}

export async function loadMicroBlog(
  _: LoaderParams
): Promise<Record<string, MicroBlogEntity>> {
  const archiveContents = await fs.promises.readFile(
    "./microBlog/feed.json",
    "utf8"
  );

  const archive = JSON.parse(archiveContents);

  const mapped: MicroBlogEntity[] = archive.items
    .map(mapMicroBlog)
    .filter(
      (micro: MicroBlogEntity) =>
        !micro.content.includes("https://zoeaubert.me") &&
        !micro.tags.includes("status")
    );

  return arrayToRecord(mapped, (micro) => micro.id);
}
