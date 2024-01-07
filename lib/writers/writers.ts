import path from "path";

import { Data } from "../types";
import { Err, Ok, Result, filterErr, orderedEntitesFromArray, orderedEntitesFromObject, writeFile, writeJSONFile } from "../utils";
import { writeArchive } from "./archiveWriter";
import { writeMicros } from "./microsWriter";
import { writeTags } from "./tagsWriter";
import { writeTimeline } from "./timelineWriter";
import { writeYears } from "./yearsWriter";
import { writePhotos } from "./photosWriter";
import { writeAlbumsAndPhoto } from "./albumsAndPhotosWriter";
import { writeNow } from "./nowWriter";
import { writeAllPosts } from "./allPostsWriter";
import { writeLego } from "./legoWriter";
import { writeGames } from "./gamesWriter";
import { writeMovies } from "./moviesWriter";
import { writeTv } from "./tvWriter";
import { logFailedPromisedResults } from "../loggger";

// const WRITERS = [
//   writeBlogPosts,
//   writeMicros,
//   writeTags,
//   writeTimeline,
//   writeYears,
//   writePhotos,
//   writeAlbumsAndPhoto,
//   writeNow,
//   writeAllPosts,
//   writeLego,
//   writeGames,
//   writeMovies,
//   writeTv,
// ];

async function writeAbout(
  data: Data,
  outputDir: string
): Promise<Result<undefined>> {
  return writeJSONFile(path.join(outputDir, "about.json"), data.about);
}

async function writeFaq(
  data: Data,
  outputDir: string
): Promise<Result<undefined>> {
  return writeJSONFile(path.join(outputDir, "faq.json"), data.faq);
}

async function writeBlogPosts(
  data: Data,
  outputDir: string
): Promise<Result<undefined>> {
  return writeJSONFile(path.join(outputDir, "blog-posts.json"), orderedEntitesFromObject(data.blogPosts));
}

export async function writeData(
  data: Data,
  outputDir: string
): Promise<Result<undefined>> {
  const dataRequest = await writeJSONFile(
    path.join(outputDir, "data.json"),
    data
  );

  if (!dataRequest.ok) {
    return dataRequest;
  }

  const results = await Promise.allSettled([
    writeAbout(data, outputDir),
    writeFaq(data, outputDir),
    writeBlogPosts(data, outputDir),
  ]);

  logFailedPromisedResults(results);

  return Ok(undefined);
}
