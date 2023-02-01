import fs from "fs";
import md5 from "md5";
import { Entity, OrderedEntities } from "./types";

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

export function sortEntitesByDate(
  entities: Record<string, Entity>
): OrderedEntities {
  const entityOrder = recordToArray(entities)
    .map((entity) => entity.id)
    .sort((a, b) => {
      const aDate = new Date((entities[a] as any).date);
      const bDate = new Date((entities[b] as any).date);
      return bDate.getTime() - aDate.getTime();
    });
  return { entityOrder, entities };
}

export function filterOrderedEntitiesBy(
  orderedEntities: OrderedEntities,
  predicate: (entity: Entity) => boolean
): OrderedEntities {
  let outOrder: OrderedEntities["entityOrder"] = [];
  let outEntities: OrderedEntities["entities"] = {};

  for (const id of orderedEntities.entityOrder) {
    const entity = orderedEntities.entities[id];
    if (entity && predicate(entity)) {
      outOrder.push(id);
      outEntities[id] = entity;
    }
  }

  return { entityOrder: outOrder, entities: outEntities };
}
