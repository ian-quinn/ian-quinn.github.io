import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter.ts";

const getSortedPosts = (posts: CollectionEntry<"blog">[]) => {
  return posts
    .filter(postFilter)
    .sort(
      (a, b) =>
        Math.floor(
          new Date(b.data.modDate ?? b.data.pubDate).getTime() / 1000
        ) -
        Math.floor(
          new Date(a.data.modDate ?? a.data.pubDate).getTime() / 1000
        )
    );
};

export default getSortedPosts;
