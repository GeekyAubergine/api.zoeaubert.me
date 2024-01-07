import fs from "fs-extra";
import path from "path";
import config from "./config";

import { Err, Ok, Result, exists, parseJson, readFile, writeFile } from "./lib/utils";
import extract from "extract-zip";
import { DEFAULT_SOURCE_DATA, SourceData, loadSourceData } from "./lib/loaders/loaders";
import { logError } from "./lib/loggger";

const PUBLIC_DIR = path.join(__dirname, "./_public");
const CACHE_DIR = path.join(__dirname, "./.cache");
const CONTENT_DIR = path.join(__dirname, "./.content");
const SOURCE_DATA_FILE = path.join(PUBLIC_DIR, "source-data.json");

const CONTENT_URL =
  "https://github.com/GeekyAubergine/zoeaubert.me-content/archive/refs/heads/main.zip";

async function prepFolders() {
  const pubDirExists = await exists(PUBLIC_DIR);

  if (!pubDirExists.ok || !pubDirExists.value) {
    await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
  }

  const cacheDirExists = await exists(config.cacheDir);
  
  if (!cacheDirExists.ok || !cacheDirExists.value) {
    await fs.promises.mkdir(config.cacheDir, { recursive: true });
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

async function loadSourceDataFromFile(): Promise<Result<SourceData>> {
  const sourceDataFile = await readFile(
    path.join(SOURCE_DATA_FILE)
  );

  if (!sourceDataFile.ok) {
    return sourceDataFile;
  }

  return parseJson(sourceDataFile.value, "Source data archive");
}

async function main() {
  console.log("Building api.zoeaubert.me data");

  await prepFolders();

  console.log("Downloading content");
  const downloadStart = Date.now();

  const contentDownloadResult = await downloadContent();

  const downloadEnd = Date.now();
  console.log(`Downloaded in ${downloadEnd - downloadStart}ms`);

  if (!contentDownloadResult.ok) {
    logError(contentDownloadResult);
    return;
  }
  
  console.log("Reading source data from file")

  let archivedSourceDataResult = await loadSourceDataFromFile();

  let sourceData = DEFAULT_SOURCE_DATA;

  if (archivedSourceDataResult.ok) {
    sourceData = archivedSourceDataResult.value;
  } else if (archivedSourceDataResult.error.type === "UNABLE_TO_READ_FILE") {
    // Do nothing, if file doesn't exist we should create it without risk of corrupting a previous archive
  } else {
    // Irrcoverable error. Prevent corrupting the archive
    logError(archivedSourceDataResult);
    return;
  }

  console.log("Loading data");
  const loadStart = Date.now();

  const sourceDataLoadingResponse = await loadSourceData(sourceData, CACHE_DIR, CONTENT_DIR);

  if (sourceDataLoadingResponse.ok) { 
    sourceData = sourceDataLoadingResponse.value;
  } else {
    // Log the error and continue with old data
    logError(sourceDataLoadingResponse);
  }

  const loadEnd = Date.now();

  console.log(`Loaded in ${loadEnd - loadStart}ms`);

  const writeSourceDataResult = await writeFile(SOURCE_DATA_FILE, JSON.stringify(sourceData));

  if (!writeSourceDataResult.ok) {
    logError(writeSourceDataResult);
    return;
  }

  // const transformStart = Date.now();

  // console.log("Transforming data");

  // const processedData = await generateData(archiveWithNewData);

  // const transformEnd = Date.now();

  // console.log(`Transformed in ${transformEnd - transformStart}ms`);

  // if (!processedData.ok) {
  //   console.error(processedData.error);
  //   return;
  // }

  // console.log("Writing data");

  // const writeStart = Date.now();

  // const writingResult = await writeData(processedData.value, PUBLIC_DIR);

  // if (!writingResult.ok) {
  //   console.error(writingResult.error);
  //   return;
  // }

  // const writeEnd = Date.now();

  // console.log(`Wrote in ${writeEnd - writeStart}ms`);

  // console.log("Done");
}

main();
