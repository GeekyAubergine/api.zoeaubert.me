import Archive from "../types";
import { Err, Ok, Result, filterErr } from "../utils";
import { writeArchive } from "./archiveWriter";
import { writeAbout } from "./aboutWriter";
import { writeBlogPosts } from "./blogPostsWriter";
import { writeFaq } from "./faqWriter";
import { writeMicros } from "./microsWriter";

const WRITERS = [
  writeArchive,
  writeAbout,
  writeBlogPosts,
  writeFaq,
  writeMicros,
];

export async function writeData(
  archive: Archive,
  outputDir: string
): Promise<Result<undefined>> {
  const results = await Promise.all(
    WRITERS.map((writer) => writer(outputDir, archive))
  );

  const errors = filterErr(results);

  if (errors.length > 0) {
    return Err(errors[0]!);
  }

  return Ok(undefined);
}
