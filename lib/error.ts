import {
  MastodonPostEntity,
  MicroBlogEntity,
  MicroPostEntity,
  TvShowSeason,
} from "./types";
import { exhaust } from "./utils";

type UnableToUploadFileToCDN = {
  type: "UNABLE_TO_UPLOAD_FILE_TO_CDN";
  localPath: string;
  uploadPath: string;
};

type UnableToDownloadFile = {
  type: "UNABLE_TO_DOWNLOAD_FILE";
  url: string;
};

type UnableToGetFileExtension = {
  type: "UNABLE_TO_GET_FILE_EXTENSION";
  url: string;
};

type BlogPostMissingSlug = {
  type: "BLOG_POST_MISSING_SLUG";
  url: string;
};

type BlogPostMissingDate = {
  type: "BLOG_POST_MISSING_DATE";
  url: string;
};

type BlogPostMissingTitle = {
  type: "BLOG_POST_MISSING_TITLE";
  url: string;
};

type BlogPostMissingDescription = {
  type: "BLOG_POST_MISSING_DESCRIPTION";
  url: string;
};

type BlogPostHeroMissingAlt = {
  type: "BLOG_POST_HERO_MISSING_ALT";
  url: string;
};

type BlogPostHeroMissingWidthOrHeight = {
  type: "BLOG_POST_HERO_MISSING_WIDTH_OR_HEIGHT";
  url: string;
};

type UnableToGetImageSize = {
  type: "UNABLE_TO_GET_IMAGE_SIZE";
  url: string;
};

type ImageMissingSrc = {
  type: "IMAGE_MISSING_SRC";
  url: string;
};

type ImageMissingAlt = {
  type: "IMAGE_MISSING_ALT";
  url: string;
};

type UnableToReadFileSystem = {
  type: "UNABLE_TO_READ_FILE_SYSTEM";
  url: string;
};

type UnableToLoadArchive = {
  type: "UNABLE_TO_LOAD_ARCHIVE";
};

type UnableToDownloadContent = {
  type: "UNABLE_TO_DOWNLOAD_CONTENT";
};

type UnableToWriteArchive = {
  type: "UNABLE_TO_WRITE_ARCHIVE";
};

type UnableToLoadAboutData = {
  type: "UNABLE_TO_LOAD_ABOUT";
};

type UnableToReadFile = {
  type: "UNABLE_TO_READ_FILE";
  path: string;
};

type MicroPostMissingDate = {
  type: "MICRO_POST_MISSING_DATE";
  url: string;
};

type MicroPostMissingTags = {
  type: "MICRO_POST_MISSING_TAGS";
  url: string;
};

type UnableToFetchUrl = {
  type: "UNABLE_TO_FETCH_URL";
  url: string;
};

type UnableToWriteFile = {
  type: "UNABLE_TO_WRITE_FILE";
  path: string;
};

type InvalidFileName = {
  type: "INVALID_FILE_NAME";
  path: string;
};

type UnableToResizeImage = {
  type: "UNABLE_TO_RESIZE_IMAGE";
  path: string;
};

type AlbumPhotoMissingUrl = {
  type: "ALBUM_PHOTO_MISSING_URL";
};

type AlbumPhotoMissingAlt = {
  type: "ALBUM_PHOTO_MISSING_ALT";
  url: string;
};

type AlubmPhotoMissingMetadata = {
  type: "ALBUM_PHOTO_MISSING_METADATA";
  url: string;
};

type AlbumPhotoMissingWidthOrHeight = {
  type: "ALBUM_PHOTO_MISSING_WIDTH_OR_HEIGHT";
  url: string;
};

type AlbumMissingTitle = {
  type: "ALBUM_MISSING_TITLE";
  path: string;
};

type AlbumMissingDate = {
  type: "ALBUM_MISSING_DATE";
  path: string;
};

type UnableToParseMoviePost = {
  type: "UNABLE_TO_PARSE_MOVIE_POST";
  post: MicroBlogEntity | MicroPostEntity | MastodonPostEntity;
};

type CouldNotFindMovie = {
  type: "COULD_NOT_FIND_MOVIE";
  movie: {
    title: string;
    year: number;
  };
};

type CouldNotParseSeason = {
  type: "COULD_NOT_PARSE_SEASON";
  season: string;
};

type UnableToParseTvShowPost = {
  type: "UNABLE_TO_PARSE_TV_SHOW_POST";
  post: MicroBlogEntity | MicroPostEntity | MastodonPostEntity;
};

type CouldNotFindTvShowFromEmptySeasons = {
  type: "COULD_NOT_FIND_TV_SHOW_FROM_EMPTY_SEASONS";
};

type CouldNotFindTvShowByTitle = {
  type: "COULD_NOT_FIND_TV_SHOW_BY_TITLE";
  title: string;
};

type CouldNotParseJson = {
  type: "COULD_NOT_PARSE_JSON";
  description: string;
};

type CouldNotReadAddress = {
  type: "COULD_NOT_READ_ADDRESS";
  path: string;
};

type CouldNotReadFileStats = {
  type: "COULD_NOT_READ_FILE_STATS";
  path: string;
};

export type ProjectError =
  | CouldNotParseJson
  | CouldNotReadAddress
  | CouldNotReadFileStats
  | UnableToUploadFileToCDN
  | UnableToDownloadFile
  | UnableToGetFileExtension
  | BlogPostMissingSlug
  | BlogPostMissingDate
  | BlogPostMissingTitle
  | BlogPostMissingDescription
  | BlogPostHeroMissingAlt
  | BlogPostHeroMissingWidthOrHeight
  | UnableToGetImageSize
  | ImageMissingSrc
  | ImageMissingAlt
  | UnableToReadFileSystem
  | UnableToLoadArchive
  | UnableToDownloadContent
  | UnableToWriteArchive
  | UnableToLoadAboutData
  | UnableToReadFile
  | MicroPostMissingDate
  | MicroPostMissingTags
  | UnableToFetchUrl
  | UnableToWriteFile
  | InvalidFileName
  | UnableToResizeImage
  | AlbumPhotoMissingUrl
  | AlbumPhotoMissingAlt
  | AlubmPhotoMissingMetadata
  | AlbumPhotoMissingWidthOrHeight
  | AlbumMissingTitle
  | AlbumMissingDate
  | UnableToParseMoviePost
  | CouldNotFindMovie
  | CouldNotParseSeason
  | UnableToParseTvShowPost
  | CouldNotFindTvShowFromEmptySeasons
  | CouldNotFindTvShowByTitle;

export function formatError(error: ProjectError): string {
  switch (error.type) {
    case "COULD_NOT_PARSE_JSON":
      return `Could not parse JSON: ${error.description}`;
    case "COULD_NOT_READ_ADDRESS":
      return `Could not read address: ${error.path}`;
    case "COULD_NOT_READ_FILE_STATS":
      return `Could not read file stats: ${error.path}`;
    case "UNABLE_TO_UPLOAD_FILE_TO_CDN":
      return `Unable to upload file to CDN: ${error.localPath} -> ${error.uploadPath}`;
    case "UNABLE_TO_DOWNLOAD_FILE":
      return `Unable to download file: ${error.url}`;
    case "UNABLE_TO_GET_FILE_EXTENSION":
      return `Unable to get file extension: ${error.url}`;
    case "BLOG_POST_MISSING_SLUG":
      return `Blog post is missing slug: ${error.url}`;
    case "BLOG_POST_MISSING_DATE":
      return `Blog post is missing date: ${error.url}`;
    case "BLOG_POST_MISSING_TITLE":
      return `Blog post is missing title: ${error.url}`;
    case "BLOG_POST_MISSING_DESCRIPTION":
      return `Blog post is missing description: ${error.url}`;
    case "BLOG_POST_HERO_MISSING_ALT":
      return `Blog post hero is missing alt: ${error.url}`;
    case "BLOG_POST_HERO_MISSING_WIDTH_OR_HEIGHT":
      return `Blog post hero is missing width or height: ${error.url}`;
    case "UNABLE_TO_GET_IMAGE_SIZE":
      return `Unable to get image size: ${error.url}`;
    case "IMAGE_MISSING_SRC":
      return `Image is missing src: ${error.url}`;
    case "IMAGE_MISSING_ALT":
      return `Image is missing alt: ${error.url}`;
    case "UNABLE_TO_READ_FILE_SYSTEM":
      return `Unable to read file system: ${error.url}`;
    case "UNABLE_TO_LOAD_ARCHIVE":
      return `Unable to load archive`;
    case "UNABLE_TO_DOWNLOAD_CONTENT":
      return `Unable to download content`;
    case "UNABLE_TO_WRITE_ARCHIVE":
      return `Unable to write archive`;
    case "UNABLE_TO_LOAD_ABOUT":
      return `Unable to load about data`;
    case "UNABLE_TO_READ_FILE":
      return `Unable to read file: ${error.path}`;
    case "MICRO_POST_MISSING_DATE":
      return `Micro post is missing date: ${error.url}`;
    case "MICRO_POST_MISSING_TAGS":
      return `Micro post is missing tags: ${error.url}`;
    case "UNABLE_TO_FETCH_URL":
      return `Unable to fetch URL: ${error.url}`;
    case "UNABLE_TO_WRITE_FILE":
      return `Unable to write file: ${error.path}`;
    case "INVALID_FILE_NAME":
      return `Invalid file name: ${error.path}`;
    case "UNABLE_TO_RESIZE_IMAGE":
      return `Unable to resize image: ${error.path}`;
    case "ALBUM_PHOTO_MISSING_URL":
      return `Album photo is missing url`;
    case "ALBUM_PHOTO_MISSING_ALT":
      return `Album photo is missing alt: ${error.url}`;
    case "ALBUM_PHOTO_MISSING_METADATA":
      return `Album photo is missing metadata: ${error.url}`;
    case "ALBUM_PHOTO_MISSING_WIDTH_OR_HEIGHT":
      return `Album photo is missing width or height: ${error.url}`;
    case "ALBUM_MISSING_TITLE":
      return `Album is missing title: ${error.path}`;
    case "ALBUM_MISSING_DATE":
      return `Album is missing date: ${error.path}`;
    case "UNABLE_TO_PARSE_MOVIE_POST":
      return `Unable to parse movie post: ${error.post.permalink}`;
    case "COULD_NOT_FIND_MOVIE":
      return `Could not find movie: ${error.movie.title} (${error.movie.year})`;
    case "COULD_NOT_PARSE_SEASON":
      return `Could not parse season: ${error.season}`;
    case "UNABLE_TO_PARSE_TV_SHOW_POST":
      return `Unable to parse TV show post: ${error.post.permalink}`;
    case "COULD_NOT_FIND_TV_SHOW_FROM_EMPTY_SEASONS":
      return `Could not find TV show from empty seasons`;
    case "COULD_NOT_FIND_TV_SHOW_BY_TITLE": 
      return `Could not find TV show by title: ${error.title}`;
    default:
      return exhaust(error);
  }
}
