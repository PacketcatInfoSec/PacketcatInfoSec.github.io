# Cloudflare deployment setup

This project uses Cloudflare Pages Functions for GitHub login and Cloudflare D1 for published Markdown. All secrets stay in Cloudflare; do not add them to GitHub or commit `.dev.vars`.

## 1. Create the D1 database

Install Wrangler if needed, sign in, and create the database:

```sh
npx wrangler login
npx wrangler d1 create packetcat-content
```

Copy the returned database ID into `wrangler.toml` in place of `REPLACE_WITH_YOUR_D1_DATABASE_ID`. Then create the table:

```sh
npx wrangler d1 migrations apply packetcat-content --remote
```

## 2. Create a GitHub OAuth app

In GitHub, go to **Settings → Developer settings → OAuth Apps → New OAuth App**. Use:

- Homepage URL: `https://YOUR_PROJECT.pages.dev`
- Authorization callback URL: `https://YOUR_PROJECT.pages.dev/api/auth/callback`

After creating it, copy the Client ID and generate a Client Secret. If you later attach a custom domain, update both URLs in the OAuth app to use that domain.

## 3. Import the repository into Cloudflare Pages

In Cloudflare, go to **Workers & Pages → Create application → Pages → Connect to Git** and select this repository.

- Production branch: `main`
- Build command: leave blank
- Build output directory: `.`

Deploy it once. Cloudflare will provide the `YOUR_PROJECT.pages.dev` hostname used in the OAuth app above.

## 4. Add the database binding and secrets

In the Pages project, go to **Settings → Bindings** and add a D1 database binding:

- Variable name: `DB`
- D1 database: `packetcat-content`

Then in **Settings → Variables and Secrets**, add these **production** secrets:

| Name | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | Client ID from the GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | Client Secret from the GitHub OAuth app |
| `SESSION_SECRET` | A unique random string, at least 32 characters |
| `ALLOWED_GITHUB_LOGIN` | `PacketcatInfoSec` (or the GitHub username you want to authorize) |

Redeploy after adding the binding and secrets.

## 5. Test

Open `https://YOUR_PROJECT.pages.dev/studio.html`, choose **Sign in with GitHub**, and use the allowed account. Create a small post; it should appear immediately on `blog.html`. Import a Markdown writeup on `writeups.html` to confirm the same access control works there.

## Local development (optional)

Copy `.dev.vars.example` to `.dev.vars`, replace its placeholders, then run:

```sh
npx wrangler pages dev . --d1 DB=YOUR_D1_DATABASE_ID
```

Use `npx wrangler d1 migrations apply packetcat-content --local` before local testing if you need the posts table locally.
