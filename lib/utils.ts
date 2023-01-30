import fs from "fs";

export async function getFilesRecursive(path: string, ext: string) {
  const files = await fs.promises.readdir(path);
  const result: string[] = [];
  for (const file of files) {
    const filePath = `${path}/${file}`;
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      result.push(...(await getFilesRecursive(filePath, ext)));
    } else if (stats.isFile() && filePath.endsWith(ext)) {
      result.push(filePath);
    }
  }
  return result;
}

export function exhaust(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}
