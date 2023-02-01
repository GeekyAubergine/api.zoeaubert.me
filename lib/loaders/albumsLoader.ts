import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import {
  AlbumAwarePhoto,
  AlbumEntity,
  Archive,
  LoaderParams,
  Photo,
} from "../types";

import { arrayToRecord, getFilesRecursive, hash } from "../utils";

const ALBUMS_DIR = path.join(__dirname, "../../albums");

const FILE_NAME_REGEX = /([\w,\s-]+)\.[A-Za-z]{3}$/;

function albumToPermalink(title: string, date: string): string {
  const d = date.split("-");
  return `/photos/${d[0]}/${d[1]!.padStart(2, "0")}/${title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "")}/index.html`;
}

function photoPermalink(albumPermalink: string, url: string) {
  const matches = url.match(FILE_NAME_REGEX);

  if (!matches) {
    throw new Error("No file name found");
  }

  const fileName = matches[1];

  if (!fileName) {
    throw new Error("No file name found");
  }

  return `${albumPermalink.replace("/index.html", "")}/${fileName}/index.html`;
}

function loadPhoto(photoData: any, albumPermalink: string): Photo {
  const { url, alt, description, tags, featured } = photoData as {
    url: string | undefined;
    alt: string | undefined;
    description: string | undefined;
    tags: string[] | undefined;
    featured: boolean | undefined;
  };

  if (!url || !alt) {
    throw new Error(`Photo is missing required attributes: ${url}`);
  }

  return {
    id: url,
    permalink: photoPermalink(albumPermalink, url),
    url,
    alt,
    description: description ?? alt,
    tags: tags ?? [],
    featured: featured ?? false,
  };
}

async function loadAlbum(
  archive: Archive,
  filePath: string
): Promise<AlbumEntity> {
  const fileContents = await fs.promises.readFile(filePath, "utf-8");

  const albumData = yaml.load(fileContents);

  const {
    title,
    description,
    date,
    photos: rawPhotos,
  } = albumData as {
    title: string | undefined;
    description: string | undefined;
    date: string | undefined;
    photos: string[] | undefined;
  };

  if (!title || !date) {
    throw new Error(`Album is missing required attributes: ${filePath}`);
  }

  const slug = albumToPermalink(title, date);

  const photos = (rawPhotos ?? []).map((photoData: any) =>
    loadPhoto(photoData, slug)
  );

  const photoOrder = photos.map((photo) => photo.id);

  const photosFull = photos.map((photo, index): AlbumAwarePhoto => {
    const previous = photoOrder[index - 1] ?? null;
    const next = photoOrder[index + 1] ?? null;

    return {
      ...photo,
      albumTitle: title,
      albumTotalPhotos: photos.length,
      previous,
      next,
      date,
    };
  });

  const photosMap = arrayToRecord(photosFull, (photo) => photo.id);

  const tags = photos.reduce<string[]>((acc, photo) => {
    const newTags = [];

    for (const tag of photo.tags) {
      if (!acc.includes(tag)) {
        newTags.push(tag);
      }
    }

    return [...acc, ...newTags];
  }, []);

  const data: Omit<AlbumEntity, "rawDataHash"> = {
    type: "album",
    id: slug,
    url: `/photos/${slug}/index.html`,
    title,
    description: description ?? null,
    date: new Date(date).toISOString(),
    photos: photosMap,
    photoOrder,
    tags,
  };

  const rawDataHash = hash(data);

  const existingEntity = archive.entities[data.id];

  if (existingEntity && existingEntity.rawDataHash === rawDataHash) {
    return existingEntity as AlbumEntity;
  }

  console.log(`Updating album: ${data.id} (${data.title})`);

  return {
    ...data,
    rawDataHash,
  };
}

export async function loadAlbums(
  loaderParams: LoaderParams
): Promise<Record<string, AlbumEntity>> {
  const { archive } = loaderParams;

  const paths = await getFilesRecursive(ALBUMS_DIR, ".yml");

  const albums = await Promise.all(
    paths.map((path) => loadAlbum(archive, path))
  );

  return arrayToRecord(albums, (album) => album.id);
}
