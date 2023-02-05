import { LoaderParams } from "../types";

const URL = "https://api.omg.lol/address/geekyaubergine/pastebin/web-faq.txt";

export async function loadFaq({ archive }: LoaderParams): Promise<string> {
  try {
    const request = await fetch(URL);

    const json = await request.json();

    const { response } = json;

    const { paste } = response;

    const { content } = paste;

    return content;
  } catch (e) {
    console.error(e);
    return archive.faq;
  }
}
