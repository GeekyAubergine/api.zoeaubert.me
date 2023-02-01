import fs from "fs";
import md5 from "md5";
import { Archive, Entity } from "./types";

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

// export async function archiveFile(url: string): Promise<string> {}

export function exhaust(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

export function hash(data: {}): string {
  return md5(JSON.stringify(data));
}

export function filterNull<T extends {}>(
  nullables: (T | null | undefined)[]
): T[] {
  return nullables.filter((v) => v != null) as T[];
}

export function recordToArray<K extends string | number | symbol, T extends {}>(
  record: Record<K, T>
): T[] {
  return filterNull(Object.keys(record).map((key) => record[key as K]));
}

export function arrayToRecord<K extends string | number | symbol, T extends {}>(
  array: T[],
  key: (value: T) => K
): Record<K, T> {
  return array.reduce((acc, value) => {
    return {
      ...acc,
      [key(value)]: value,
    };
  }, {} as Record<K, T>);
}

export function archiveEntitiesInOrder(archive: Archive): Entity[] {
  return filterNull(archive.entityOrder.map((id) => archive.entities[id]));
}

export function archiveEntitiesOfTypeInOrder(
  archive: Archive,
  type: Entity["type"]
): Entity[] {
  const entities = archiveEntitiesInOrder(archive);

  return entities.filter((e) => e.type === type);
}
