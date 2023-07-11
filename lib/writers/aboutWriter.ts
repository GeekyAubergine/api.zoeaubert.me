import path from 'path'
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeAbout(
    outputDir: string,
    data: Data,
): Promise<Result<undefined>> {
    const outputPath = path.join(outputDir, "about.md");

    return writeFile(outputPath, data.about);
}