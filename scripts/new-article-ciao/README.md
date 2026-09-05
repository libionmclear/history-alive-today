# Add article: Ciao Really Means "I Am Your Slave"

| | |
|---|---|
| **Slug** | `ciao-really-means-i-am-your-slave` |
| **Category** | `things-we-say` |
| **Author** | Libion McLear |
| **Id** | 64 |
| **Words** | ~1,090 |
| **Images** | 4 — **none require attribution** |

---

## Prompt for Copilot / Claude in VS Code

```
Add a new article to this site. Everything you need is already in the repo,
in scripts/new-article-ciao/. Do not invent content — use those files.

1. Open scripts/new-article-ciao/1-data-entry.ts.txt. It contains one Article
   object inside a comment header. Insert that object (not the comment) as the
   FIRST element of the `articles` array in src/lib/data.ts, directly after the
   line `export const articles: Article[] = [`.

2. Open scripts/new-article-ciao/2-articleContent-entry.ts.txt. It contains one
   keyed entry, 'ciao-really-means-i-am-your-slave'. Insert it as the FIRST key
   of the `articleContent` object in src/lib/articleContent.ts, directly after
   the line
   `export const articleContent: Record<string, ContentSection[]> = {`.

3. Run: node scripts/fetch-images-ciao.mjs
   This downloads four images into public/images/uploads/2026/09/. Report any
   FAIL lines to me instead of substituting different images.

4. Run: npm run build
   Fix only type or syntax errors introduced by steps 1 and 2.

5. Run: npm run dev, and confirm these two pages render:
   /article/ciao-really-means-i-am-your-slave
   /category/things-we-say

Constraints:
- Do not modify, reorder or reformat any existing article entry.
- Do not edit the caption or body text.
- Do not reformat the files with Prettier or change quote style.

When the build and both pages are clean, commit and push:
  git add -A
  git commit -m "Add article: Ciao Really Means I Am Your Slave"
  git push
Vercel deploys from the push.
```

---

## By hand

1. `node scripts/fetch-images-ciao.mjs` — writes into `public/images/uploads/2026/09/`:
   `venice-rialto-carpaccio.jpg`, `giovanni-verga-portrait.jpg`,
   `hemingway-milan-1918.jpg`, `italian-emigrants-ellis-island-1905.jpg`
2. Paste `1-data-entry.ts.txt` into `src/lib/data.ts`. Change `date` if you are
   not publishing today (currently `September 5, 2026`).
3. Paste `2-articleContent-entry.ts.txt` into `src/lib/articleContent.ts`.
4. `npm run build`, then commit and push.

---

## Licences

All four images are free of obligations — three public domain, one "no
restrictions" from Flickr Commons. Nothing to print, nothing share-alike. This
is a cleaner set than the caps-and-gowns and 60-minutes articles, which each
carried two CC BY-SA images.

---

## Notes on the content

- About 1,090 words. The weight is in the two spread sections, which is where the
  worthwhile detail lives: which countries use it, in which spelling, and what it
  means there.
- The article turns on a genuinely dark etymology (the word "slave" comes from
  the name of the Slavic peoples). It is handled in three sentences and then
  moves on, so the piece stays readable rather than becoming a history of
  slavery. Please keep that proportion if you edit.
- `imagePair` is used for Verga and Hemingway side by side, the same device as
  the Loggan pair in the caps-and-gowns article.
- No politics anywhere in this piece by design. An earlier draft had a section on
  the song Bella Ciao; it was cut deliberately and should not come back.
- The "What Happened to It on the Way" section carries the best under-known fact:
  Italian uses ciao for both hello and goodbye, but almost every borrowing took
  only the goodbye half — and Japanese took only the hello half.
- The Slav etymology twist ("the people who speak") is hedged on purpose;
  etymologists disagree. Keep the hedge.
