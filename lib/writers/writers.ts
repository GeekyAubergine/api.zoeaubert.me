import Data from "../types";
import { Err, Ok, Result, filterErr } from "../utils";
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

const WRITERS = [
  writeArchive,
  writeAbout,
  writeBlogPosts,
  writeFaq,
  writeMicros,
  writeTags,
  writeTimeline,
  writeYears,
  writePhotos,
  writeAlbumsAndPhoto,
  writeNow,
  writeAllPosts,
  writeLego,
  writeGames,
];

export async function writeData(
  data: Data,
  outputDir: string
): Promise<Result<undefined>> {
  const results = await Promise.all(
    WRITERS.map((writer) => writer(outputDir, data))
  );

  const errors = filterErr(results);

  if (errors.length > 0) {
    return Err(errors[0]!);
  }

  return Ok(undefined);
}
