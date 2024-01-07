import { describe, expect, it } from "@jest/globals";

import { Ok } from "../utils";
import {
  ReviewForMovie,
  cleanMovieTitle,
  parseMastodonPost,
  parseMicroPostPost,
  parseMicroblogPost,
} from "./processMovies";
import {
  DataMastodonPost,
  DataMicroBlogArchivePost,
  DataMicroPost,
} from "lib/types";

describe("moviesWriter", () => {
  describe("#cleanMovieTitle", () => {
    it("should format correctly", () => {
      expect(cleanMovieTitle("The Blues Brothers")).toEqual(
        "the-blues-brothers"
      );
    });
  });

  describe("#parseReviewPost", () => {
    it("should parse legacy micro blog format", () => {
      const post: DataMicroBlogArchivePost = {
        key: "/micros/2022/10/05/chicken-little-nice",
        permalink: "/micros/2022/10/05/chicken-little-nice",
        date: "2022-10-05T21:00:00.000Z",
        content:
          "[Chicken Little](https://www.imdb.com/title/tt0371606/) (2005) 🍿\n" +
          "\n" +
          "3/5 - Nice easy watch, some good moments and laughs\n",
        description:
          "[Chicken Little](https://www.imdb.com/title/tt0371606/) (2005) 🍿",
        images: [],
        tags: ["Movies"],
      };

      const result = parseMicroblogPost(post);

      const expected: ReviewForMovie = {
        movieTitleAndYear: {
          title: "Chicken Little",
          year: 2005,
        },
        review: {
          score: 3,
          review: "Nice easy watch, some good moments and laughs",
          date: "2022-10-05T21:00:00.000Z",
          postPermalink: "/micros/2022/10/05/chicken-little-nice",
        },
      };

      expect(result).toEqual(Ok(expected));
    });

    it("should parse legacy micro blog format with no review", () => {
      const post: DataMicroBlogArchivePost = {
        key: "/micros/2022/12/06/desert-hearts",
        permalink: "/micros/2022/12/06/desert-hearts",
        date: "2022-12-06T23:00:00.000Z",
        content:
          "[Desert Hearts](https://www.imdb.com/title/tt0089015/) (1985) 🍿\n\n3/5\n",
        description:
          "[Desert Hearts](https://www.imdb.com/title/tt0089015/) (1985) 🍿",
        images: [],
        tags: ["Movies"],
      };

      const result = parseMicroblogPost(post);

      const expected: ReviewForMovie = {
        movieTitleAndYear: {
          title: "Desert Hearts",
          year: 1985,
        },
        review: {
          score: 3,
          review: null,
          date: "2022-12-06T23:00:00.000Z",
          postPermalink: "/micros/2022/12/06/desert-hearts",
        },
      };

      expect(result).toEqual(Ok(expected));
    });

    it("should parse legacy micro blog format with custom metadata in year", () => {
      const post: DataMicroBlogArchivePost = {
        key: "/micros/2022/12/22/the-blues-brothers",
        permalink: "/micros/2022/12/22/the-blues-brothers",
        date: "2022-12-22T23:01:45.000Z",
        content:
          "[The Blues Brothers](https://www.imdb.com/title/tt0080455/) (1980 - Extended Version) 🍿\n" +
          "\n" +
          "5/5 - This film gets better every time I watch it.\n",
        description:
          "[The Blues Brothers](https://www.imdb.com/title/tt0080455/) (1980 - Extended Version) 🍿",
        images: [],
        tags: ["Movies"],
      };

      const result = parseMicroblogPost(post);

      const expected: ReviewForMovie = {
        movieTitleAndYear: {
          title: "The Blues Brothers",
          year: 1980,
        },
        review: {
          score: 5,
          review: "This film gets better every time I watch it.",
          date: "2022-12-22T23:01:45.000Z",
          postPermalink: "/micros/2022/12/22/the-blues-brothers",
        },
      };

      expect(result).toEqual(Ok(expected));
    });

    it("should parse micro post format", () => {
      const post: DataMicroPost = {
        key: "all-quiet-2023-02-04T20:04",
        permalink: "/micros/2023/02/04/all-quiet",
        date: "2023-02-04T20:04",
        content:
          "[All Quiet on the Western Front](https://www.imdb.com/title/tt1016150/) (2022)\n\n3/5 - I see why others enjoyed it, but a lot of it felt like gore for the sake of gore. The performances are great.",
        tags: ["Movies"],
        images: [],
      };

      const result = parseMicroPostPost(post);

      const expected: ReviewForMovie = {
        movieTitleAndYear: {
          title: "All Quiet on the Western Front",
          year: 2022,
        },
        review: {
          score: 3,
          review:
            "I see why others enjoyed it, but a lot of it felt like gore for the sake of gore. The performances are great.",
          date: "2023-02-04T20:04",
          postPermalink: "/micros/2023/02/04/all-quiet",
        },
      };

      expect(result).toEqual(Ok(expected));
    });

    it("should parse mastodon post format", () => {
      const post: DataMastodonPost = {
        key: "mastodon-110521615616918604",
        permalink: "/micros/2023/06/110521615616918604",
        originalUrl: "https://social.lol/@geekyaubergine/110521615616918604",
        date: "2023-06-10T19:40:19.551Z",
        content:
          "<p>The Menu (2022)</p><p>2/5 - Interesting, but not for me</p>",
        tags: ["Movies"],
        images: [],
      };

      const result = parseMastodonPost(post);

      const expected: ReviewForMovie = {
        movieTitleAndYear: {
          title: "The Menu",
          year: 2022,
        },
        review: {
          score: 2,
          review: "Interesting, but not for me",
          date: "2023-06-10T19:40:19.551Z",
          postPermalink: "/micros/2023/06/110521615616918604",
        },
      };

      expect(result).toEqual(Ok(expected));
    });

    it("should parse mastodon post format with no review", () => {
      const post: DataMastodonPost = {
        key: "mastodon-109939038343455006",
        permalink: "/micros/2023/02/109939038343455006",
        originalUrl: "https://social.lol/@geekyaubergine/109939038343455006",
        date: "2023-02-27T22:23:15.822Z",
        content: "<p>Yentl (1983)</p><p>3/5</p>",
        tags: ["Movies"],
        images: [],
      };

      const result = parseMastodonPost(post);

      const expected: ReviewForMovie = {
        movieTitleAndYear: {
          title: "Yentl",
          year: 1983,
        },
        review: {
          score: 3,
          review: null,
          date: "2023-02-27T22:23:15.822Z",
          postPermalink: "/micros/2023/02/109939038343455006",
        },
      };

      expect(result).toEqual(Ok(expected));
    });
  });
});
