# Paste this into Copilot / Claude in VS Code

Open the `history-alive-today` folder first, then paste everything inside the
code block below.

```
Add a new article to this site. The written content is already in the repo, in
scripts/new-article-cappuccino/. Do not invent or rewrite any of it.

STEP 1 - src/lib/data.ts
Open scripts/new-article-cappuccino/1-data-entry.ts.txt. It contains one Article
object inside a comment header. Insert that object (not the comment) as the
FIRST element of the `articles` array, directly after the line:
  export const articles: Article[] = [

STEP 2 - src/lib/articleContent.ts
Open scripts/new-article-cappuccino/2-articleContent-entry.ts.txt. It contains
one keyed entry, 'your-cappuccino-is-named-after-a-monks-robe'. Insert it as the
FIRST key of the `articleContent` object, directly after the line:
  export const articleContent: Record<string, ContentSection[]> = {

STEP 3 - images
The LEAD IMAGE is already committed in the repo at
public/images/uploads/2026/09/friar-with-cappuccino.jpg. Do not download,
replace, regenerate or overwrite it. It is the og:image.

Create public/images/uploads/2026/09/ if it does not exist and download these
three files into it. Either run  node scripts/fetch-images-cappuccino.mjs  or
fetch the URLs directly. Save each under the exact filename given.

  vienna-cafe-griensteidl-1896.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/Cafe-Griensteidl-1896.jpg
  1490x997, public domain, Reinhold Voelkel 1896

  capuchin-friar-murbach.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/Capuchin%20at%20work%20by%20Johann%20Murbach.jpg
  2300x3005, CC BY-SA 3.0, credit "Docteur Ralph / Wikimedia Commons"

  cappuccino-cup.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/Cappuccino%20in%20original.jpg
  6000x4000, CC BY 2.0, credit "Vee Satayamas"

Send a User-Agent header when downloading; Wikimedia rejects requests without
one. Each file should be well over 50 KB - anything tiny is an error page, so
delete it and report the failure rather than substituting a different image.

STEP 4 - build
Run: npm run build
Fix only type or syntax errors introduced by steps 1 and 2.

STEP 5 - check
Run: npm run dev, and confirm these pages render with all four images (the lead illustration plus the three downloads):
  /article/your-cappuccino-is-named-after-a-monks-robe
  /category/things-we-use

CONSTRAINTS
- Do not modify, reorder or reformat any existing article entry.
- Do not edit the body or caption text. Two captions carry required CC credits;
  removing them is a licence violation.
- Do not reformat files with Prettier or change quote style.
- Do not swap in different images.

WHEN CLEAN
  git add -A
  git commit -m "Add article: Your Cappuccino Is Named After a Monks Robe"
  git push
Vercel deploys from the push.
```

---

## Lead image and og:image

The lead image is friar-with-cappuccino.jpg, supplied by the author and already
committed to the repo. The site derives og:image from the article's first image,
so this is what Facebook will show.

924x600, landscape at roughly 1.54:1, 156 KB. Well inside the scraper's limits
and close enough to Facebook's preferred 1.91:1 that it crops cleanly.

The caption reads "They have been drinking themselves for two hundred and fifty years."
Leave it exactly as it is. Do not add a disclaimer, a date, or a note about
the image being an illustration.

## Licence note

Two of the three Commons images need a printed credit. Both credits are already written
into the captions in 2-articleContent-entry.ts.txt:

- capuchin-friar-murbach.jpg - Docteur Ralph / Wikimedia Commons / CC BY-SA 3.0
- cappuccino-cup.jpg - Vee Satayamas / CC BY 2.0

The Viennese coffee house is public domain; the lead illustration is the author's own. Commons is thin on freely
licensed pictures of Capuchin friars in habit, and the obvious public-domain
candidate turned out on inspection to show a prelate in a purple robe, not a
Capuchin at all, so it was rejected.

## Commons pages

| File | Commons page |
|---|---|
| vienna-cafe-griensteidl-1896.jpg | https://commons.wikimedia.org/wiki/File:Cafe-Griensteidl-1896.jpg |
| capuchin-friar-murbach.jpg | https://commons.wikimedia.org/wiki/File:Capuchin_at_work_by_Johann_Murbach.jpg |
| cappuccino-cup.jpg | https://commons.wikimedia.org/wiki/File:Cappuccino_in_original.jpg |
