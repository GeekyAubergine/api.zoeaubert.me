import path from 'path'
import { Result, writeFile } from "../utils";
import Archive from "../types";

export async function writeAbout(
    outputDir: string,
    archive: Archive,
): Promise<Result<undefined>> {
    const archivePath = path.join(outputDir, "about.md");

    return writeFile(archivePath, archive.about);
}