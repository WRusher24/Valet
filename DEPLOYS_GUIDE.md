# Valet — Deployment Guide

Valet is a Next.js (App Router) application backed by Neon PostgreSQL (Drizzle ORM), Auth.js credentials authentication and Vercel Blob for user photo uploads.

## 1. Prerequisites

- Node.js 20 or newer and npm
- A [Neon](https://neon.tech) account (free tier is sufficient)
- A [Vercel](https://vercel.com) account with this repository connected to GitHub

## 2. Local setup

```bash
git clone https://github.com/WRusher24/Valet.git
cd Valet
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see sections 3–5):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign Auth.js session tokens |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for outfit photo uploads |

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## 3. Create the Neon PostgreSQL database

1. In the Neon console choose **New Project** and pick the region closest to your Vercel region.
2. On the project dashboard open **Connect** and copy the **pooled** connection string (the host contains `-pooler`). It ends with `?sslmode=require`.
3. Paste it into `.env.local` as `DATABASE_URL="..."`.

## 4. Create the schema and load the starter lookbook

```bash
npm run db:push && npm run db:seed
```

- `db:push` creates all tables, enums and indexes from `src/db/schema.ts`.
- `db:seed` loads the Curated Starter Library: 16 two-, three- and four-colour palettes with 53 outfits, each with a garment breakdown and broad colour-family tags.

The seed script is idempotent: palettes that already exist (matched by slug) are skipped, so it is safe to re-run. To wipe and reload only the curated library (user data in other tables is untouched, except favourites and wear logs that point at curated outfits):

```bash
npm run db:seed -- --reset
```

Versioned SQL migrations are committed in `drizzle/`. If you prefer migrations over `push` (recommended for production databases), run `npm run db:migrate` instead of `db:push`. After editing the schema, run `npm run db:generate` to produce a new migration.

Optionally verify that the seeded Unsplash photos are reachable from your network:

```bash
npm run db:check-images
```

Any photo that cannot load is replaced in the UI by a palette-striped placeholder, so users never see a broken-image icon.

## 5. Configure Vercel Blob

1. In the Vercel dashboard open your project (or create it first, see section 7) → **Storage** → **Create Database** → **Blob**.
2. Connect the store to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project's environment variables.
3. For local development, open the store → **.env.local** tab, copy the token and add it to your local `.env.local`:

```
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

Both **public** and **private** Blob stores are supported. The app detects the store's mode automatically (set `BLOB_ACCESS=public` or `BLOB_ACCESS=private` to force one). Private-store photos are streamed through `/api/photos/...`, which only serves a photo to the user who uploaded it.

Uploads are limited to 4 MB per photo (a Vercel serverless request limit). The upload form automatically downsizes large phone photos in the browser before sending them.

## 6. Run locally

```bash
npm run dev
```

Open http://localhost:3000, create an account and the starter library appears immediately. Before shipping, confirm that production builds are clean:

```bash
npm run lint && npm run build
```

## 7. Deploy from GitHub to Vercel

1. In Vercel choose **Add New… → Project** and import `WRusher24/Valet`.
2. Framework preset: **Next.js** (auto-detected). Leave build and output settings at their defaults.
3. Add environment variables for **Production** (and Preview, if you want preview deployments to work):
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (added automatically if you connected a Blob store)
4. Click **Deploy**.
5. The `vercel-build` script automatically applies the committed migrations and loads the starter lookbook on every deploy (both steps are idempotent). You only need to run the commands below manually for local development, or if you set a custom Build Command in Vercel:

```bash
npm run db:push && npm run db:seed
```

Every later push to the production branch redeploys automatically.

## 8. Security notes

- Passwords are hashed with bcrypt (cost 12); sessions are signed JWT cookies.
- Every query and mutation is scoped by the signed-in user's id. Curated rows have a `NULL` owner and are read-only to everyone; private combos, uploads, favourites and wear logs can only be read or changed by their owner.
- Uploaded files are validated by signature (JPEG, PNG or WebP only), stored under a per-user path with a random suffix, and deleted from Blob when the user deletes the outfit or combo.
- Blob URLs are unguessable but public by design; do not upload anything you would not share by link.
- Consider adding rate limiting (for example Vercel Firewall or Upstash) on `/login` and `/register` before a public launch.

## 9. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `DATABASE_URL is not set` | Create `.env.local` from `.env.example`. |
| `UntrustedHost` or session errors in production | Make sure `AUTH_SECRET` is set in Vercel. |
| Upload says photo uploads aren't configured | Add `BLOB_READ_WRITE_TOKEN` and redeploy. |
| Explore is empty | Run `npm run db:seed` against the same database the app uses. |

## 10. My Closet module

My Closet adds three tables (`wardrobe_items`, `closet_outfits`, `closet_outfit_items`) and two enums in migration `drizzle/0002_*.sql`. The migration is purely additive, so existing users, combos, photos and wear logs are untouched.

- **On Vercel:** nothing to do. The `vercel-build` script applies pending migrations on every deploy.
- **Locally:** run `npm run db:migrate` (recommended) or `npm run db:push`.
- Closet photos use the same Vercel Blob store as outfit photos (stored under `closet/<user id>/`) and need `BLOB_READ_WRITE_TOKEN`. Private stores are supported automatically.

### Colour-family update (migration 0003)

Closet items now use 10 colour families (`browns_tan`, `beige_khaki`, `stone_sand`, `blues`, `greys`, `greens`, `whites_creams`, `blacks`, `burgundy_reds`, `yellows_brights`). Migration `0003` converts existing items safely: `browns` becomes `browns_tan` and the retired `pastels_other` becomes `yellows_brights`; every other family keeps its name. Existing items in other families may deserve a re-check in the edit form (for example, change a beige chino from Browns & Tan to Beige & Khaki). Vercel applies the migration automatically on deploy; locally run `npm run db:migrate`.

The lookbook's own 8-family tagging (By Item tab) is unchanged; closet families map onto it when matching (Stone & Sand matches both Whites & Creams and Greys, Beige & Khaki matches Browns, Yellows & Brights matches Pastels & Other).
