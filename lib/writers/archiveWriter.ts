import path from 'path'
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeArchive(
    outputDir: string,
    archive: Data,
): Promise<Result<undefined>> {
    const archivePath = path.join(outputDir, "archive.json");

    return writeFile(archivePath, JSON.stringify(archive, null, 2));
}