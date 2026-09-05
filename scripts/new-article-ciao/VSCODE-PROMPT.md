# Paste this into Copilot / Claude in VS Code

Open the `history-alive-today` folder first, then paste everything inside the
code block below.

```
Add a new article to this site. The written content is already in the repo, in
scripts/new-article-ciao/. Do not invent or rewrite any of it.

STEP 1 — src/lib/data.ts
Open scripts/new-article-ciao/1-data-entry.ts.txt. It contains one Article
object inside a comment header. Insert that object (not the comment) as the
FIRST element of the `articles` array, directly after the line:
  export const articles: Article[] = [

STEP 2 — src/lib/articleContent.ts
Open scripts/new-article-ciao/2-articleContent-entry.ts.txt. It contains one
keyed entry, 'ciao-really-means-i-am-your-slave'. Insert it as the FIRST key of
the `articleContent` object, directly after the line:
  export const articleContent: Record<string, ContentSection[]> = {

STEP 3 — images
Create the folder public/images/uploads/2026/09/ and download these four files
into it. Either run  node scripts/fetch-images-ciao.mjs  or fetch the URLs
directly. Save each one under the exact filename given — the article body
references these paths.

  venice-rialto-carpaccio.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/Accademia%20-%20Miracle%20of%20the%20Holy%20Cross%20at%20Rialto%20by%20Vittore%20Carpaccio.jpg
  4326x4068, public domain, Carpaccio c.1496, Gallerie dell'Accademia

  giovanni-verga-portrait.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/Portrait%20of%20Giovanni%20Verga.jpg
  1787x2107, public domain, photograph no later than 1920

  hemingway-milan-1918.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/Ernest%20Hemingway%20in%20Milan%201918%20retouched.jpg
  760x1281, public domain, Ermeni Studios 1918

  italian-emigrants-ellis-island-1905.jpg
  https://commons.wikimedia.org/wiki/Special:FilePath/An%20Italian%20mother%20and%20child%20just%20arrived%20at%20Ellis%20Island%2C%20NMFF.000705%20%22Peace%22%20(6620099783).jpg
  3656x4664, no restrictions, Lewis Hine 1905, Preus Museum

Send a User-Agent header when downloading; Wikimedia rejects requests without
one. Each file should be well over 50 KB — anything tiny is an error page, so
delete it and report the failure rather than substituting a different image.

STEP 4 — build
Run: npm run build
Fix only type or syntax errors introduced by steps 1 and 2.

STEP 5 — check
Run: npm run dev, and confirm these two pages render with all four images:
  /article/ciao-really-means-i-am-your-slave
  /category/things-we-say

CONSTRAINTS
- Do not modify, reorder or reformat any existing article entry.
- Do not edit the body or caption text.
- Do not reformat files with Prettier or change quote style.
- Do not swap in different images.

WHEN CLEAN
  git add -A
  git commit -m "Add article: Ciao Really Means I Am Your Slave"
  git push
Vercel deploys from the push.
```

---

## Reference — image provenance

All four are free of obligations: three public domain, one "no restrictions".
Nothing needs a printed credit line and nothing is share-alike.

| File | Commons page |
|---|---|
| venice-rialto-carpaccio.jpg | https://commons.wikimedia.org/wiki/File:Accademia_-_Miracle_of_the_Holy_Cross_at_Rialto_by_Vittore_Carpaccio.jpg |
| giovanni-verga-portrait.jpg | https://commons.wikimedia.org/wiki/File:Portrait_of_Giovanni_Verga.jpg |
| hemingway-milan-1918.jpg | https://commons.wikimedia.org/wiki/File:Ernest_Hemingway_in_Milan_1918_retouched.jpg |
| italian-emigrants-ellis-island-1905.jpg | https://commons.wikimedia.org/wiki/File:An_Italian_mother_and_child_just_arrived_at_Ellis_Island,_NMFF.000705_%22Peace%22_(6620099783).jpg |

All four download URLs were opened and confirmed to resolve to the real files.
