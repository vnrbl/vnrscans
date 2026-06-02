import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { extractChaptersFromSeriesUrl, extractImagesFromChapterUrl } from "../chapter-scraper";

export const $extractChaptersFromUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    try {
      const chapters = await extractChaptersFromSeriesUrl(data.url);
      return { success: true, chapters };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to extract chapters" 
      };
    }
  });

export const $extractImagesFromUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    try {
      const images = await extractImagesFromChapterUrl(data.url);
      return { success: true, images };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to extract images" 
      };
    }
  });
