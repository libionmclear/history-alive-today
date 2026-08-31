# Add article: "Why Does an Hour Have 60 Minutes? Blame Babylon"

Everything needed to publish one new article, in the same shape as
`why-do-graduates-dress-like-medieval-clerics` (id 62).

| | |
|---|---|
| **Slug** | `why-does-an-hour-have-60-minutes` |
| **Category** | `things-we-use` |
| **Author** | Libion McLear |
| **Id** | 63 |
| **Words** | ~1,000 |
| **Images** | 7 (5 unrestricted, 2 CC BY-SA with credit already in the captions) |

---

## Hand this to Copilot / Claude in VS Code

> In this repo, add a new article with slug `why-does-an-hour-have-60-minutes`.
>
> 1. Open `scripts/new-article-60-minutes/1-data-entry.ts.txt` and insert its
>    object (the part inside the comment block) as the **first** element of the
>    `articles` array in `src/lib/data.ts`.
> 2. Open `scripts/new-article-60-minutes/2-articleContent-entry.ts.txt` and
>    insert its entry as the **first** key of the `articleContent` object in
>    `src/lib/articleContent.ts`.
> 3. Run `node scripts/fetch-images-60-minutes.mjs` to download the seven
>    images into `public/images/uploads/2026/08/`.
> 4. Run `npm run build` and confirm it compiles with no type errors.
> 5. Do not modify any other article entries.

---

## Or do it by hand — four steps

**1. Images**

```
node scripts/fetch-images-60-minutes.mjs
```

Downloads into `public/images/uploads/2026/08/`:

```
babylonian-tablet-ybc-7289.jpg        senenmut-astronomical-ceiling.jpg
ptolemy-almagest-1213.jpg             salisbury-cathedral-clock.jpg
huygens-pendulum-clock-1673.jpg       french-decimal-pocket-watch.jpg
nist-caesium-fountain-clock.jpg
```

The script skips files that already exist, prints OK/FAIL with sizes, and on
failure prints the Commons page URL so you can grab that one by hand.

**2. `src/lib/data.ts`** — paste the object from `1-data-entry.ts.txt` as the
first element of the `articles` array. Change `date` if you are not publishing
today (currently `August 31, 2026`).

**3. `src/lib/articleContent.ts`** — paste the entry from
`2-articleContent-entry.ts.txt` as the first key of `articleContent`.

**4. Build and deploy**

```
npm run build
git add -A
git commit -m "Add article: Why Does an Hour Have 60 Minutes? Blame Babylon"
git push
```

Vercel deploys from the push. Check `/article/why-does-an-hour-have-60-minutes`
and the `/category/things-we-use` listing.

---

## Licence obligations — do not strip these

Five images carry no obligations. Two are CC BY-SA and the credit is already
written into the `caption` text in `2-articleContent-entry.ts.txt`:

- **salisbury-cathedral-clock.jpg** — `© Seth Whales / Wikimedia Commons / CC BY-SA 4.0`
- **french-decimal-pocket-watch.jpg** — `Rama / Wikimedia Commons / CC BY-SA 3.0 FR`

CC BY-SA is a share-alike licence. If that is awkward for the site's terms,
delete those two `image` / `imagePair` sections — the article reads fine on
five pictures, and the surrounding prose does not depend on them.

---

## Notes on the content

- Uses `imagePair` for the Salisbury clock beside the 1673 Huygens engraving,
  the same device as the Loggan pair in the caps-and-gowns article.
- The published web version of the piece has a divisor comparison drawn as a
  diagram (60 splits twelve ways, 100 only nine). `ContentSection` has no
  figure type, so that argument is carried in prose instead, in the third
  paragraph of "A Number Chosen Because It Splits Well".
- "Why base 60" has no settled scholarly answer. The text gives three competing
  theories rather than asserting one. Please keep that hedge if you edit.
