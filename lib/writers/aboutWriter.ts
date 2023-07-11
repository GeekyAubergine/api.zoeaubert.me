import path from 'path'
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeAbout(
    outputDir: string,
    archive: Data,
): Promise<Result<undefined>> {
    const archivePath = path.join(outputDir, "about.md");

    return writeFile(archivePath, archive.about);
}