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

export type ProjectError =
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
  | UnableToWriteFile;
