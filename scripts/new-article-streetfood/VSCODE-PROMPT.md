# Paste this into the VS Code chat agent

New article. Everything is in the repo under `scripts/new-article-streetfood/`. Work through these in order and tell me if anything does not match what you find.

**1. Get the images.**

Run `node scripts/fetch-images-streetfood.mjs` from the repo root. The twelfth image, `roman-street-food-counter.jpg`, is already in `public/images/uploads/2026/09/` — do not overwrite it. The script downloads the other eleven from Wikimedia into `public/images/uploads/2026/09/`:

- `pompeii-counter-vetutius.jpg`
- `greek-comic-actor.jpg`
- `pompeii-counter-vi-8-8.jpg`
- `ostia-bar-interior.jpg`
- `vetutius-shrine-fresco.jpg`
- `ostia-food-painting.jpg`
- `pompeii-bakery-lantern-slide.jpg`
- `pompeii-loaf-engraving-1832.jpg`
- `herculaneum-bread-figs.jpg`
- `pompeii-tavern-serving-1882.jpg`
- `pompeii-tavern-dice-1882.jpg`

If any download fails, stop and tell me rather than carrying on with a missing file.

**2. Add the article to the list.**

Open `src/lib/data.ts`. Insert the block from `scripts/new-article-streetfood/1-data-entry.ts.txt` as the **first entry** in the `articles` array, above `id: 66`. Change nothing else.

**Important:** this file uses CRLF line endings. Keep them. Do not reformat and do not let Prettier run across the whole file.

**3. Add the article body.**

Open `src/lib/articleContent.ts`. Insert the block from `scripts/new-article-streetfood/2-articleContent-entry.ts.txt` as the **first key** in the `articleContent` object, above `'who-cursed-friday-the-13th'`. Change nothing else.

**Important:** this file uses LF line endings. Keep them.

Note this article uses **four `imagePair` sections** — two images side by side under a shared caption — as well as four single `image` sections. Check that every pair renders side by side and does not stack badly on a phone.

**4. Check it.**

- The slug `the-ancient-origins-of-fast-food` appears exactly once in each file.
- `id: 67` is not already used.
- All twelve image paths point at files that exist on disk.
- The build compiles with no TypeScript errors.
- `/article/the-ancient-origins-of-fast-food` renders. All twelve images load, the four pairs sit side by side, and the banner crop shows the queue of faces and the cook, not the cobbles.

**5. Expect two generated files in the diff** — `src/lib/imageSizes.ts` and `legacy-redirects.json` are rewritten by the prebuild hook. Commit them with the article.

Show me the diff before committing.

---

## What this article is

- **Title:** The Ancient Origins of Fast Food
- **Slug:** `the-ancient-origins-of-fast-food`
- **Category:** Things we do
- **ID:** 67
- **Date:** September 11, 2026
- **Lead / og:image:** `/images/uploads/2026/09/roman-street-food-counter.jpg` — already in the repo, do not download it

## Image credits

The lead image is yours. Nine of the eleven Wikimedia files are **public domain or CC0** and need nothing.

Two need a credit, and the credit is already written into the caption text — do not strip it:

| File | Credit | Licence |
| --- | --- | --- |
| `ostia-bar-interior.jpg` | Marie-Lan Nguyen | CC BY 2.5 |
| `ostia-food-painting.jpg` | MumblerJamie | CC BY-SA 2.0 |
