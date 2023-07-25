import fs from "fs-extra";
import path from "path";
import config from "./config";

import { Err, Ok, Result, exists } from "./lib/utils";
import { Data } from "./lib/types";
import extract from "extract-zip";
import { loadData } from "./lib/loaders/loaders";
import { writeData } from "./lib/writers/writers";
import { generateData } from "./lib/processors/processors";

const PUBLIC_DIR = path.join(__dirname, "./_public");
const CACHE_DIR = path.join(__dirname, "./.cache");
const CONTENT_DIR = path.join(__dirname, "./.content");

const DEFAULT_DATA: Data = {
  blogPosts: {
    entityOrder: [],
    entities: {},
  },
  microBlogsPosts: {
    entityOrder: [],
    entities: {},
  },
  microPosts: {
    entityOrder: [],
    entities: {},
  },
  mastodonPosts: {
    entityOrder: [],
    entities: {},
  },
  statusLolPosts: {
    entityOrder: [],
    entities: {},
  },
  albums: {
    entityOrder: [],
    entities: {},
  },
  albumPhotos: {
    entityOrder: [],
    entities: {},
  },
  lego: {},
  games: {},
  about: "",
  faq: "",
  now: "",
  movies: {},
  tvShows: {},
  lastUpdated: "",
};

const CONTENT_URL =
  "https://github.com/GeekyAubergine/zoeaubert.me-content/archive/refs/heads/main.zip";

async function prepFolders() {
  if (!(await exists(PUBLIC_DIR))) {
    await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
  }
  if (!(await exists(config.cacheDir))) {
    await fs.promises.mkdir(config.cacheDir, { recursive: true });
  }
}

async function loadArchive(): Promise<Result<Data>> {
  try {
    const archiveFile = await fs.promises.readFile(
      path.join(PUBLIC_DIR, "archive.json"),
      "utf-8"
    );

    return Ok(JSON.parse(archiveFile));
  } catch (e) {
    // TODO Try loading from backup
    return Err({
      type: "UNABLE_TO_LOAD_ARCHIVE",
    });
  }
}

async function downloadContent(): Promise<Result<undefined>> {
  try {
    const contentDirExists = await exists(CONTENT_DIR);

    if (contentDirExists.ok && contentDirExists.value) {
      await fs.rm(CONTENT_DIR, { recursive: true });
    }

    const contentZip = await fetch(CONTENT_URL);

    const contentBlob = await contentZip.blob();

    const arrayBuffer = await contentBlob.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(path.join(config.cacheDir, "temp.zip"), buffer);

    await extract(path.join(config.cacheDir, "temp.zip"), {
      dir: path.join(__dirname, "content-temp"),
    });

    await fs.copy(
      path.join(__dirname, "content-temp/zoeaubert.me-content-main"),
      CONTENT_DIR
    );

    await fs.rm(path.join(config.cacheDir, "temp.zip"), { recursive: true });

    await fs.rm(path.join(__dirname, "content-temp"), { recursive: true });

    return Ok(undefined);
  } catch (e) {
    console.error(e);
    return Err({
      type: "UNABLE_TO_DOWNLOAD_CONTENT",
    });
  }
}

async function main() {
  console.log("Building api.zoeaubert.me data");

  await prepFolders();

  const archiveResult = await loadArchive();

  const archive = archiveResult.ok ? archiveResult.value : DEFAULT_DATA;

  const contentDownloadResult = await downloadContent();

  if (!contentDownloadResult.ok) {
    console.error(contentDownloadResult.error);
    return;
  }

  console.log("Loading data");

  const loadStart = Date.now();

  const loadDataResult = await loadData(archive, CACHE_DIR, CONTENT_DIR);

  if (!loadDataResult.ok) {
    console.error(loadDataResult.error);
    return;
  }

  const loaderData = loadDataResult.value;

  const archiveWithNewData = {
    ...archive,
    ...loaderData,
  };

  const loadEnd = Date.now();

  console.log(`Loaded in ${loadEnd - loadStart}ms`);

  const transformStart = Date.now();

  console.log("Transforming data");

  const processedData = await generateData(archiveWithNewData);

  const transformEnd = Date.now();

  console.log(`Transformed in ${transformEnd - transformStart}ms`);

  if (!processedData.ok) {
    console.error(processedData.error);
    return;
  }

  console.log("Writing data");

  const writeStart = Date.now();

  const writingResult = await writeData(processedData.value, PUBLIC_DIR);

  if (!writingResult.ok) {
    console.error(writingResult.error);
    return;
  }

  const writeEnd = Date.now();

  console.log(`Wrote in ${writeEnd - writeStart}ms`);

  console.log("Done");
}

main();
