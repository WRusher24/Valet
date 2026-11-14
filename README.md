# Valet

A mobile-first men's office & smart-casual colour-combination lookbook with real outfit references.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · Neon PostgreSQL · Auth.js (Credentials) · Vercel Blob

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN
npm run db:push && npm run db:seed
npm run dev
```

- Deployment steps: [DEPLOYS_GUIDE.md](DEPLOYS_GUIDE.md)
- End-user walkthrough: [USER_GUIDE.md](USER_GUIDE.md)

## Structure

```
src/app/(auth)      login & register
src/app/(app)       Explore, By Item, Shuffle, Closet, Log, Add, combo detail
src/app/(app)/closet  inventory, item forms, outfit builder, single-item match
src/app/(app)/shuffle/closet  smart shuffle from the user's own closet
src/app/actions     server actions (auth, combos, outfits)
src/app/api/outfits Vercel Blob upload endpoints
src/app/api/closet  wardrobe item create/edit endpoints
src/db              Drizzle schema, lazy Neon client, seed data
src/lib             constants, scoped queries, session helpers
scripts             seed and image-check scripts
drizzle             generated SQL migrations
```

## Data isolation

Curated rows have `user_id = NULL`. Every read filters on `user_id IS NULL OR user_id = <me>`, and every write/delete filters on `user_id = <me>`, so one user can never read or change another user's private combos, uploads, favourites or wear history.
