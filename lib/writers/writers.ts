import path from "path";

import { Data } from "../types";
import { Err, Ok, Result, filterErr, writeFile, writeJSONFile } from "../utils";
import { writeArchive } from "./archiveWriter";
import { writeAbout } from "./aboutWriter";
import { writeBlogPosts } from "./blogPostsWriter";
import { writeFaq } from "./faqWriter";
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
//   writeArchive,
//   writeAbout,
//   writeBlogPosts,
//   writeFaq,
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

export async function writeSimples(
  data: Data,
  outputDir: string
): Promise<Result<undefined>> {
  const aboutRequest = writeFile(
    path.join(outputDir, "about.md"),
    data.about.content
  );
  const faqRequest = writeFile(
    path.join(outputDir, "faq.md"),
    data.faq.content
  );

  const results = await Promise.allSettled([aboutRequest, faqRequest]);

  logFailedPromisedResults(results);

  return Ok(undefined);
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

  const results = await Promise.allSettled([writeSimples(data, outputDir)]);

  logFailedPromisedResults(results);

  return Ok(undefined);
}
