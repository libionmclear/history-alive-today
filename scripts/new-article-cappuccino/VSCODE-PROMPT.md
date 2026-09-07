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
Create public/images/uploads/2026/09/ if it does not exist and download these
four files into it. Either run  node scripts/fetch-images-cappuccino.mjs  or
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

  capuchin-monkey-costa-rica.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/Capuchin%20Costa%20Rica.jpg
  1505x1473, CC BY-SA 3.0, credit "David M. Jensen (Storkk)"

Send a User-Agent header when downloading; Wikimedia rejects requests without
one. Each file should be well over 50 KB - anything tiny is an error page, so
delete it and report the failure rather than substituting a different image.

STEP 4 - build
Run: npm run build
Fix only type or syntax errors introduced by steps 1 and 2.

STEP 5 - check
Run: npm run dev, and confirm these pages render with all four images:
  /article/your-cappuccino-is-named-after-a-monks-robe
  /category/things-we-use

CONSTRAINTS
- Do not modify, reorder or reformat any existing article entry.
- Do not edit the body or caption text. Three captions carry required CC credits;
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

## Licence note - read this one

Three of the four images need a printed credit, which is more than the last few
articles. The credits are already written into the captions in
2-articleContent-entry.ts.txt:

- capuchin-friar-murbach.jpg - Docteur Ralph / Wikimedia Commons / CC BY-SA 3.0
- cappuccino-cup.jpg - Vee Satayamas / CC BY 2.0
- capuchin-monkey-costa-rica.jpg - David M. Jensen (Storkk) / CC BY-SA 3.0

Only the Viennese coffee house is public domain. Commons is thin on freely
licensed pictures of Capuchin friars in habit, and the obvious public-domain
candidate turned out on inspection to show a prelate in a purple robe, not a
Capuchin at all, so it was rejected.

If you would rather carry fewer obligations, drop the monkey photograph. The
monkey paragraph reads fine without a picture, and that removes one CC BY-SA.

## Commons pages

| File | Commons page |
|---|---|
| vienna-cafe-griensteidl-1896.jpg | https://commons.wikimedia.org/wiki/File:Cafe-Griensteidl-1896.jpg |
| capuchin-friar-murbach.jpg | https://commons.wikimedia.org/wiki/File:Capuchin_at_work_by_Johann_Murbach.jpg |
| cappuccino-cup.jpg | https://commons.wikimedia.org/wiki/File:Cappuccino_in_original.jpg |
| capuchin-monkey-costa-rica.jpg | https://commons.wikimedia.org/wiki/File:Capuchin_Costa_Rica.jpg |
