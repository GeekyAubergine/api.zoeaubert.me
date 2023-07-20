import path from 'path'
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeArchive(
    outputDir: string,
    data: Data,
): Promise<Result<undefined>> {
    const outputPath = path.join(outputDir, "archive.json");

    return writeFile(outputPath, JSON.stringify(data, null, 2));
}