import path from 'path'
import { Result, writeFile } from "../utils";
import Archive from "../types";

export async function writeFaq(
    outputDir: string,
    archive: Archive,
): Promise<Result<undefined>> {
    const archivePath = path.join(outputDir, "faq.md");

    return writeFile(archivePath, archive.faq);
}