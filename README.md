# Ryddat — Landing page

Static landing page for Ryddat (supplier-document workflow platform). No build step —
plain HTML/CSS/JS, brand fonts and logos are copied into `assets/`.

## Local preview

Open `index.html` directly, or serve it locally:

```bash
python -m http.server 8420
```

Then visit http://localhost:8420.

## Deploy to Cloudflare Pages

This folder *is* the git repo — no subdirectory config needed on Cloudflare's side.

1. Push this repo to GitHub (or GitLab).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
   and pick this repo.
3. Build settings: framework preset **None**, build command **empty**, build output
   directory **/** (repo root — that's this folder).
4. Deploy. Every push to `main` auto-deploys. Cloudflare gives you a `*.pages.dev` URL
   immediately; attach a custom domain under **Custom domains** once ready.
