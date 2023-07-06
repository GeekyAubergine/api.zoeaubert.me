import fs from "fs-extra"
import path from 'path'
import { Err, Ok, Result } from "../utils";
import Archive from "../types";

export async function writeArchive(
    outputDir: string,
    archive: Archive,
): Promise<Result<void>> {
    const archivePath = path.join(outputDir, "archive.json");

    try {
        await fs.writeFile(archivePath, JSON.stringify(archive, null, 2));
        return Ok(undefined);
    } catch (e) {
        return Err({
            type: "UNABLE_TO_WRITE_ARCHIVE",
        });
    }
}