import Archive from "../types";
import { Err, Ok, Result } from "../utils";
import { writeArchive } from "./archiveWriter";
import { ProjectError } from "../error";

const WRITERS = [
    writeArchive,
]

export async function writeData(archive: Archive, outputDir: string): Promise<Result<undefined>> {
    const results = await Promise.all(WRITERS.map(writer => writer(outputDir, archive)));

    const firstError = results.find(result => !result.ok) as ProjectError | undefined;

    if (firstError) {
        return Err(firstError);
    }

    return Ok(undefined);
}