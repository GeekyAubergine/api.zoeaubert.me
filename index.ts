import fs from "fs";
import path from "path";

import { loadBlogPosts } from "./lib/loaders/blogPostsLoader";
import { Entity } from "./lib/types";
import { writeArchive } from "./lib/writers/archiveWriter";

const PUBLIC_DIR = path.join(__dirname, "./_public");

async function prepFolders() {
  const exists = await fs.promises
    .stat(PUBLIC_DIR)
    .then(() => true)
    .catch(() => false);
  if (exists) {
    await fs.promises.rm(PUBLIC_DIR, { recursive: true });
  }
  await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
}

async function main() {
  console.log("Hello World");

  await prepFolders();

  const blogPostLoader = loadBlogPosts();

  const loaders = [blogPostLoader];

  console.log("Loading data");

  const loadStart = Date.now();

  const [posts] = await Promise.all(loaders);

  const loadEnd = Date.now();

  console.log(`Loaded in ${loadEnd - loadStart}ms`);

  const entities: Entity[] = [...posts];

  const sorted = entities.sort((a, b) => b.date.getTime() - a.date.getTime());

  const writers = [writeArchive(PUBLIC_DIR, sorted)];

  console.log("Writing data");

  const writeStart = Date.now();

  await Promise.all(writers);

  const writeEnd = Date.now();

  console.log(`Wrote in ${writeEnd - writeStart}ms`);

  console.log("Done");
}

main();
