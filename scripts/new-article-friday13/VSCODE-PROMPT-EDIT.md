# Paste this into the VS Code chat agent

Tightening pass on the article that is already live. Only one file changes.

**1. Replace the article body.**

Open `src/lib/articleContent.ts` and find the key `'who-cursed-friday-the-13th'`. Replace that entire block — from the line `'who-cursed-friday-the-13th': [` down to and including its closing `],` — with the contents of `scripts/new-article-friday13/3-articleContent-REVISED.ts.txt`.

Nothing else in the file changes. Do not touch any other key.

**Important:** this file uses LF line endings. Keep them. Do not reformat the file and do not let Prettier run across the whole thing.

**2. Do not touch `src/lib/data.ts`.** The title, slug, excerpt, date and lead image are all unchanged.

**3. Check it.**

- The build compiles with no TypeScript errors.
- `/article/who-cursed-friday-the-13th` renders, all three images still load, and the images sit in the same three places as before.
- The diff touches `src/lib/articleContent.ts` and nothing else. `imageSizes.ts` and `legacy-redirects.json` should not change, since no images and no article metadata changed — if the prebuild hook rewrites them anyway, that is fine, just tell me.

Show me the diff before committing.

---

## What changed and why

Five text sections are shorter. The article drops from about 1,260 words to about 1,110. No facts changed, no images changed, no headings changed.

- **The Templar afterlife** — was a full paragraph about the Order of Christ, Portuguese caravels and the cross on the sails. Now two sentences. That was a tangent; the article is about the date.
- **The silence** — was two paragraphs. Now one, three sentences. It keeps the two lines that matter: "it is not an acquittal" and "which is its own kind of true."
- **The confessions**, **Clement V's bull**, **the Loki close**, **Grose**, and **the verdict** — each trimmed by a few words.
