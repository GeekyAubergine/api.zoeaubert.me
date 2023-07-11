import path from 'path'
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeFaq(
    outputDir: string,
    archive: Data,
): Promise<Result<undefined>> {
    const archivePath = path.join(outputDir, "faq.md");

    return writeFile(archivePath, archive.faq);
}