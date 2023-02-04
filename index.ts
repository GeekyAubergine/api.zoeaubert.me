import fs from "fs";
import path from "path";
import config from "./config";

import { loadMastadonToots } from "./lib/loaders/mastodonLoader";
import { loadBlogPosts } from "./lib/loaders/blogPostsLoader";
import { loadStatusLol } from "./lib/loaders/statuslolLoader";
import { Archive, Entity, LoaderParams } from "./lib/types";
import { writeArchive } from "./lib/writers/archiveWriter";
import { writeBlogPosts } from "./lib/writers/blogPostsWriter";
import { writeMicros } from "./lib/writers/microsWriter";
import { writeTimeline } from "./lib/writers/timelineWriter";
import { loadMicroBlog } from "./lib/loaders/microBlogLoader";
import { writeMicroBlogs } from "./lib/writers/microBlogWriter";
import { writeToots } from "./lib/writers/tootsWriter";
import { loadAlbums } from "./lib/loaders/albumsLoader";
import { writeAlbums } from "./lib/writers/albumsWriter";
import { exists } from "./lib/utils";

const PUBLIC_DIR = path.join(__dirname, "./_public");

async function prepFolders() {
  if (!(await exists(PUBLIC_DIR))) {
    await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
  }
  if (!(await exists(config.cacheDir))) {
    await fs.promises.mkdir(config.cacheDir, { recursive: true });
  }
}

async function loadArchive(): Promise<Archive> {
  try {
    const archiveFile = await fs.promises.readFile(
      path.join(PUBLIC_DIR, "archive.json"),
      "utf-8"
    );

    return JSON.parse(archiveFile);
  } catch (e) {
    // TODO Try loading from github archive
    return {
      entities: {},
      entityOrder: [],
      lastUpdated: "1970-00-00T00:00:00.000Z",
    };
  }
}

async function main() {
  console.log("Hello World");

  await prepFolders();

  const archive = await loadArchive();

  const loaderParams: LoaderParams = {
    archive,
    cacheDirectory: "",
  };

  const loaders = [
    loadBlogPosts(loaderParams),
    loadStatusLol(loaderParams),
    loadMastadonToots(loaderParams),
    loadMicroBlog(loaderParams),
    loadAlbums(loaderParams),
  ];

  console.log("Loading data");

  const loadStart = Date.now();

  const results: Record<string, Entity>[] = await Promise.all(loaders);

  const loadEnd = Date.now();

  console.log(`Loaded in ${loadEnd - loadStart}ms`);

  const entitiesMap: Record<string, Entity> = results.reduce(
    (acc, result: Record<string, Entity>) => ({ ...acc, ...result }),
    archive.entities
  );

  const entityIdDatePairs = Object.entries(entitiesMap).map(([id, entity]) => ({
    id,
    date: new Date(entity.date),
  }));

  const sortedIdDatePairs = entityIdDatePairs.sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const entityOrder = sortedIdDatePairs.map((pair) => pair.id);

  const newArchive: Archive = {
    entities: entitiesMap,
    entityOrder,
    lastUpdated: new Date().toISOString(),
  };

  const writers = [
    writeArchive(PUBLIC_DIR, newArchive),
    writeBlogPosts(PUBLIC_DIR, newArchive),
    writeMicros(PUBLIC_DIR, newArchive),
    writeTimeline(PUBLIC_DIR, newArchive),
    writeMicroBlogs(PUBLIC_DIR, newArchive),
    writeToots(PUBLIC_DIR, newArchive),
    writeAlbums(PUBLIC_DIR, newArchive),
  ];

  console.log("Writing data");

  const writeStart = Date.now();

  await Promise.all(writers);

  const writeEnd = Date.now();

  console.log(`Wrote in ${writeEnd - writeStart}ms`);

  console.log("Done");
}

main();