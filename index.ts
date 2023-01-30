import fs from "fs";
import path from "path";
import { loadMastadonToots } from "./lib/loaders/mastodonLoader";
import { writeMastodon } from "./lib/writers/statuslolWriter copy";
import { loadBlogPosts } from "./lib/loaders/blogPostsLoader";
import { loadStatusLol } from "./lib/loaders/statuslolLoader";
import { Entity } from "./lib/types";
import { writeArchive } from "./lib/writers/archiveWriter";
import { writeBlogPosts } from "./lib/writers/blogPostsWriter";
import { writeStatuslol } from "./lib/writers/statuslolWriter";

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

  const loaders = [loadBlogPosts(), loadStatusLol(), loadMastadonToots()];

  console.log("Loading data");

  const loadStart = Date.now();

  const results = await Promise.all(loaders);

  const [posts, statuslols, mastodonToots] = results;

  const loadEnd = Date.now();

  console.log(`Loaded in ${loadEnd - loadStart}ms`);

  const entities: Entity[] = [
    ...(posts ?? []),
    ...(statuslols ?? []),
    ...(mastodonToots ?? []),
  ];

  const sorted = entities.sort((a, b) => b.date.getTime() - a.date.getTime());

  const writers = [
    writeArchive(PUBLIC_DIR, sorted),
    writeBlogPosts(PUBLIC_DIR, sorted),
    writeStatuslol(PUBLIC_DIR, sorted),
    writeMastodon(PUBLIC_DIR, sorted),
  ];

  console.log("Writing data");

  const writeStart = Date.now();

  await Promise.all(writers);

  const writeEnd = Date.now();

  console.log(`Wrote in ${writeEnd - writeStart}ms`);

  console.log("Done");
}

main();
