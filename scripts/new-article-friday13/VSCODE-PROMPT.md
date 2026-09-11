# Paste this into the VS Code chat agent

I want to add a new article to this site. Everything you need is already in the repo under `scripts/new-article-friday13/`. Work through these steps in order and tell me if anything does not match what you find.

**1. Get the two missing images.**

Run `node scripts/fetch-images-friday13.mjs` from the repo root. It downloads two public-domain images from Wikimedia into `public/images/uploads/2026/09/`:

- `templars-burning-1314.jpg`
- `rossini-1829.jpg`

The third image, `templar-arrest-1307.jpg`, is already in that folder — do not overwrite it. If either download fails, stop and tell me rather than carrying on with a missing file.

**2. Add the article to the list.**

Open `src/lib/data.ts`. Find the `articles` array and insert the block from `scripts/new-article-friday13/1-data-entry.ts.txt` as the **first entry**, above the one with `id: 65` (the cappuccino article). Do not change any other entry.

**Important:** this file uses CRLF line endings. Keep them. Do not reformat the file, do not let Prettier run across the whole thing, and do not change anything you were not asked to change.

**3. Add the article body.**

Open `src/lib/articleContent.ts`. Find the `articleContent` object and insert the block from `scripts/new-article-friday13/2-articleContent-entry.ts.txt` as the **first key**, above `'your-cappuccino-is-named-after-a-monks-robe'`. Do not change any other key.

**Important:** this file uses LF line endings. Keep them.

**4. Check it.**

- Confirm the slug `who-cursed-friday-the-13th` appears exactly once in each file.
- Confirm `id: 66` is not already used by another article.
- Confirm all three image paths in the new content block point at files that actually exist on disk.
- Run the build and make sure it compiles with no TypeScript errors.
- Start the dev server and open `/things-we-think/who-cursed-friday-the-13th`. Check that the banner image shows the row of faces and not the cloaks, that all three images load, and that the subtitle under the title reads: *Buildings skip the thirteenth floor and nobody can tell you why...*

**5. Then show me a diff of exactly what changed** — I want to see that only the two library files and the new image files are touched, and that neither file has been rewritten wholesale because of line endings. Do not commit or push until I have looked at it.

---

## What this article is

- **Title:** Who Cursed Friday the 13th?
- **Slug:** `who-cursed-friday-the-13th`
- **Category:** Things we think
- **ID:** 66
- **Date:** September 11, 2026
- **Lead / og:image:** `/images/uploads/2026/09/templar-arrest-1307.jpg`

## Image credits

All three are free to use with no attribution required.

| File | What it is | Licence |
| --- | --- | --- |
| `templar-arrest-1307.jpg` | The arrest of the Templars, British Library Royal MS 20 C VII, f. 42v, Paris, 1380s | CC0 |
| `templars-burning-1314.jpg` | The burning of the Grand Master, same manuscript, f. 48r | Public domain |
| `rossini-1829.jpg` | Rossini, engraved by Henri Grevedon, 1829 | Public domain |
