import path from 'path'
import { Result, writeFile } from "../utils";
import Data from "../types";

export async function writeFaq(
    outputDir: string,
    data: Data,
): Promise<Result<undefined>> {
    const outputPath = path.join(outputDir, "faq.md");

    return writeFile(outputPath, data.faq);
}