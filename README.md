This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin, writers & analytics

The site has a private back office, all behind a shared login at `/login`.

- **`/admin`** — analytics dashboard: most-viewed stories, average time on page,
  referrers, top countries, and a 30-day views chart (custom tracking in Redis).
- **`/admin/review`** — editorial review queue: approve writer submissions to
  publish them live, or reject with a note.
- **`/admin/writers`** — create writer/admin accounts and set their passwords.
- **`/writer`** — a writer's dashboard: draft articles in a Markdown editor with
  a live preview, upload images, pick the card thumbnail and hero image, then
  submit for review.

### Roles & accounts

- **Owner (you):** authenticated from env vars — username `ADMIN_USERNAME`
  (default `admin`) and password `ADMIN_PASSWORD`. Always an admin; can't be
  deleted.
- **Writers / admins:** created in `/admin/writers`, stored in Redis with scrypt-
  hashed passwords. Writers can author and submit; admins can also review and
  manage accounts.

Sessions are opaque tokens stored in Redis (30-day httpOnly cookie).

### Content & publishing

Writer articles live in Redis. Approving one publishes it **live immediately**,
merged into the home page, category pages, search, and its own article page
alongside the built-in articles in `src/lib/data.ts`. Bodies are written in
Markdown; uploaded images are stored in **Vercel Blob**.

### Required environment variables

| Variable | Purpose |
| --- | --- |
| `ADMIN_USERNAME` | Owner login username (optional, defaults to `admin`). |
| `ADMIN_PASSWORD` | Owner login password. Required for any login to work. |
| `KV_REST_API_URL` | Upstash Redis REST URL (accounts, content, sessions, analytics). |
| `KV_REST_API_TOKEN` | Upstash Redis REST token. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for writer image uploads. |

Set these in **Vercel → Project → Settings → Environment Variables** (and in a
local `.env.local` for development).

**One-time setup for image uploads:** in the Vercel dashboard, open the
**Storage** tab and create a **Blob** store for this project. Vercel then adds
`BLOB_READ_WRITE_TOKEN` automatically. Until it's set, the editor will still work
but image uploads return an error.

Custom analytics (referrers, country, dwell time) only collect data from the
moment they're deployed — they do not backfill historical Vercel Analytics data.
Country data comes from Vercel's geo headers, so it appears only in production.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
