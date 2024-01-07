import { describe, expect, it } from "@jest/globals";

import {
  ReviewForTvShowSeason,
  cleanTvShowTitle,
  parseSeasonNumbers,
} from "./processsTvShows";
import { Ok } from "../utils";
import { DataMastodonPost, DataMicroBlogArchivePost } from "../types";
import { parseMastodonPost, parseMicroblogPost } from "./processsTvShows";

describe("processTvShows", () => {
  describe("#cleanTvShowTitle", () => {
    it("should format correctly", () => {
      expect(cleanTvShowTitle("F Is for Family")).toEqual("f-is-for-family");
    });
  });

  describe("#parseSeasonNumbers", () => {
    it("should parse season numbers", () => {
      expect(parseSeasonNumbers("(S7)")).toEqual(Ok([7]));

      expect(parseSeasonNumbers("(Seasons 3, 4 & 5)")).toEqual(Ok([3, 4, 5]));
    });
  });

  describe("#parseReviewPost", () => {
    it("should parse legacy micro blog format", () => {
      const post: DataMicroBlogArchivePost = {
        key: "/micros/2022/11/09/f-is-for",
        permalink: "/micros/2022/11/09/f-is-for",
        date: "2022-11-09T21:38:20.000Z",
        content:
          "[F Is for Family](https://www.imdb.com/title/tt4326894/) (Seasons 3, 4 & 5) 📺\n\n4/5 - The show continues to improve. The last two seasons touch on much more serious subjects and the show really shines for it.\n",
        description:
          "[F Is for Family](https://www.imdb.com/title/tt4326894/) (Seasons 3, 4 & 5) 📺",
        images: [],
        tags: ["TV"],
      };

      const result = parseMicroblogPost(post);

      const expected: ReviewForTvShowSeason[] = [
        {
          tvShowTitle: "F Is for Family",
          seasonNumber: 3,
          review: {
            score: 4,
            review:
              "The show continues to improve. The last two seasons touch on much more serious subjects and the show really shines for it.",
            date: "2022-11-09T21:38:20.000Z",
            postPermalink: "/micros/2022/11/09/f-is-for",
          },
        },
        {
          tvShowTitle: "F Is for Family",
          seasonNumber: 4,
          review: {
            score: 4,
            review:
              "The show continues to improve. The last two seasons touch on much more serious subjects and the show really shines for it.",
            date: "2022-11-09T21:38:20.000Z",
            postPermalink: "/micros/2022/11/09/f-is-for",
          },
        },
        {
          tvShowTitle: "F Is for Family",
          seasonNumber: 5,
          review: {
            score: 4,
            review:
              "The show continues to improve. The last two seasons touch on much more serious subjects and the show really shines for it.",
            date: "2022-11-09T21:38:20.000Z",
            postPermalink: "/micros/2022/11/09/f-is-for",
          },
        },
      ];

      expect(result).toEqual(Ok(expected));
    });

    it("should parse mastodon format", () => {
      const post: DataMastodonPost = {
        key: "mastodon-110686438229258081",
        permalink: "/micros/2023/07/110686438229258081",
        originalUrl: "https://social.lol/@geekyaubergine/110686438229258081",
        date: "2023-07-09T22:16:53.023Z",
        content:
          "<p>Game of Thrones (S7)</p><p>2/5 - The worst so far. Let&#39;s see how bad S8 is.</p>",
        tags: ["TV"],
        images: [],
      };

      const result = parseMastodonPost(post);

      const expected: ReviewForTvShowSeason[] = [
        {
          tvShowTitle: "Game of Thrones",
          seasonNumber: 7,
          review: {
            score: 2,
            review: "The worst so far. Let&#39;s see how bad S8 is.",
            date: "2023-07-09T22:16:53.023Z",
            postPermalink: "/micros/2023/07/110686438229258081",
          },
        },
      ];

      expect(result).toEqual(Ok(expected));
    });
  });
});
