import { Err, Ok, Result } from "../utils";

const URL = "https://api.omg.lol/address/geekyaubergine/pastebin/web-about.txt";

export async function loadAbout(): Promise<Result<string>> {
  try {
    const request = await fetch(URL);

    const json = await request.json();

    const { response } = json;

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
