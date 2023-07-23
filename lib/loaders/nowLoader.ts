import { Err, Ok, Result, fetchUrl } from "../utils";

const URL = "https://api.omg.lol/address/geekyaubergine/pastebin/web-now.txt";

export async function loadNow(): Promise<Result<string>> {
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

    return Ok(content);
  } catch (e) {
    return Err({
      type: "UNABLE_TO_FETCH_URL",
      url: URL,
    });
  }
}
