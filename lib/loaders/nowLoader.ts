import { Err, Ok, Result, fetchUrl } from "../utils";

const URL = "https://api.omg.lol/address/geekyaubergine/pastebin/web-now.txt";

export type SourceDataNow = {
  content: string;
};

export const DEFAULT_SOURCE_DATA_NOW: SourceDataNow = {
  content: "",
};

export async function loadNow(): Promise<Result<SourceDataNow>> {
  try {
    const request = await fetchUrl<{
      response: {
        paste: {
          content: string;
        };
      };
    }>(URL);

    if (!request.ok) {
      return request;
    }

    const { response } = request.value;

    const { paste } = response;

    const { content } = paste;

    return Ok({ content });
  } catch (e) {
    return Err({
      type: "UNABLE_TO_FETCH_URL",
      url: URL,
    });
  }
}
