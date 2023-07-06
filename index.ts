import fs from "fs";
import path from "path";
import config from "./config";

import { exists } from "./lib/utils";
import { Archive, Entity, LoaderParams } from "./lib/types";

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
      about: "",
      now: "",
      faq: "",
      links: "",
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

  const basicLoaders = [
    loadAbout(loaderParams),
    loadNow(loaderParams),
    loadFaq(loaderParams),
    loadLinks(loaderParams),
  ] as const;

  const entityLoaders = [
    loadBlogPosts(loaderParams),
    loadStatusLol(loaderParams),
    loadMastadonToots(loaderParams),
    loadMicroBlogArchive(loaderParams),
    loadAlbums(loaderParams),
    loadMicros(loaderParams),
  ] as const;

  console.log("Loading data");

  const loadStart = Date.now();

  const basicResults = await Promise.all(basicLoaders);

  const entityResults: Record<string, Entity>[] = await Promise.all(
    entityLoaders
  );

  const loadEnd = Date.now();

  console.log(`Loaded in ${loadEnd - loadStart}ms`);

  const [about, now, faq, links] = basicResults;

  const entitiesMap: Record<string, Entity> = entityResults.reduce(
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
    about,
    now,
    faq,
    links,
  };

  const writers = [
    writeArchive(PUBLIC_DIR, newArchive),
    writeBlogPosts(PUBLIC_DIR, newArchive),
    writeMicros(PUBLIC_DIR, newArchive),
    writeTimeline(PUBLIC_DIR, newArchive),
    writeMicroBlogs(PUBLIC_DIR, newArchive),
    writeToots(PUBLIC_DIR, newArchive),
    writeAlbums(PUBLIC_DIR, newArchive),
    writeStatusLols(PUBLIC_DIR, newArchive),
    writeAbout(PUBLIC_DIR, newArchive),
    writeNow(PUBLIC_DIR, newArchive),
    writeTags(PUBLIC_DIR, newArchive),
    writeAll(PUBLIC_DIR, newArchive),
    writeYears(PUBLIC_DIR, newArchive),
    writePhotos(PUBLIC_DIR, newArchive),
    writeFaq(PUBLIC_DIR, newArchive),
    writeLinks(PUBLIC_DIR, newArchive),
  ];

  console.log("Writing data");

  const writeStart = Date.now();

  await Promise.all(writers);

  const writeEnd = Date.now();

  console.log(`Wrote in ${writeEnd - writeStart}ms`);

  console.log("Done");
}

main();
