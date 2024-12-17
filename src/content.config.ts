import { SITE } from "./config.ts";
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    author: z.string().default(SITE.author),
    pubDate: z.date(),
    modDate: z.date().optional().nullable(),
    title: z.string(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default(["others"]),
    description: z.string(),
    canonicalURL: z.string().optional(),
    editPost: z.object({
      disabled: z.boolean().optional(),
      url: z.string().optional(),
      text: z.string().optional(),
      appendFilePath: z.boolean().optional(),
    }).optional(),
  }),
});

const shelf = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/shelf" }),
  schema: z.object({
    category: z.string(),
    description: z.string(),
  }),
});

export const collections = { blog, shelf };