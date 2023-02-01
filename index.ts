import fs from "fs";
import path from "path";
import config from "./config";

import { loadMastadonToots } from "./lib/loaders/mastodonLoader";
import { writeMastodon } from "./lib/writers/mastodonWriter";
import { loadBlogPosts } from "./lib/loaders/blogPostsLoader";
import { loadStatusLol } from "./lib/loaders/statuslolLoader";
import { Archive, Entity, LoaderParams } from "./lib/types";
import { writeArchive } from "./lib/writers/archiveWriter";
import { writeBlogPosts } from "./lib/writers/blogPostsWriter";
import { writeStatuslol } from "./lib/writers/statuslolWriter";
import { writeTimeline } from "./lib/writers/timelineWriter";

const PUBLIC_DIR = path.join(__dirname, "./_public");

async function prepFolders() {
  const exists = await fs.promises
    .stat(PUBLIC_DIR)
    .then(() => true)
    .catch(() => false);
  if (exists!) {
    await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
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
    config,
    cacheDirectory: "",
  };

  const loaders = [
    loadBlogPosts(loaderParams),
    loadStatusLol(loaderParams),
    loadMastadonToots(loaderParams),
  ];

  console.log("Loading data");

  const loadStart = Date.now();

  const results = await Promise.all(loaders);

  const [posts, statuslols, mastodonToots] = results;

  const loadEnd = Date.now();

  console.log(`Loaded in ${loadEnd - loadStart}ms`);

  const entitiesMap: Record<string, Entity> = {
    ...archive.entities,
    ...(posts ?? {}),
    ...(statuslols ?? {}),
    ...(mastodonToots ?? {}),
  };

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
    writeStatuslol(PUBLIC_DIR, newArchive),
    writeMastodon(PUBLIC_DIR, newArchive),
    writeTimeline(PUBLIC_DIR, newArchive),
  ];

  console.log("Writing data");

  const writeStart = Date.now();

  await Promise.all(writers);

  const writeEnd = Date.now();

  console.log(`Wrote in ${writeEnd - writeStart}ms`);

  console.log("Done");
}

main();
