# Deploy Social9 on Coolify

Social9 is a Next.js **static export**. The Dockerfile installs locked dependencies
with Node 22, runs `next build`, and copies the exported site into an Nginx image.
Nginx runs as an unprivileged user on **8080**. All photo processing still happens
in the visitor's browser. No database, persistent volume or API keys are required.

## Coolify settings

Commit and push the app and deployment files to the Git repository Coolify will
use. Include `core/`, `public/` (including the model files), `src/`, and the npm
lockfile; they are needed for the build.

Create an application from that repository, select the deployment branch, and use:

| Setting | Value |
| --- | --- |
| Build Pack / Build strategy | **Dockerfile** |
| Base Directory | `/` (repository root) |
| Dockerfile Location | `/Dockerfile` (root Dockerfile) |
| Docker Build Target | Leave empty (uses the final runtime stage) |
| Ports Exposes | **8080** |
| Port Mappings | Leave empty; Coolify's proxy handles public traffic |
| Domain | Your HTTPS domain, e.g. `https://social9.s4meer.com` |
| Persistent storage | None |
| Build / start commands | Leave empty; the Dockerfile handles both |

In **Environment Variables**, add:

```dotenv
NEXT_PUBLIC_SITE_URL=https://social9.s4meer.com
```

Use your actual public origin, with no trailing slash or path. Enable **Available
during build** / **Build Variable** for this value. The Dockerfile declares and
consumes it as an `ARG`; changing only a runtime variable cannot update a static
export. Rebuild and redeploy whenever the domain changes. The default is
`https://social9.s4meer.com` if you omit the variable. `.env.example` documents the value
for local development; local `.env` files are excluded from the Docker context.

Point the domain's DNS at your Coolify server and let Coolify provision HTTPS.
HTTPS is required for service workers and browser GPU features (localhost is
also allowed for local testing). Select **Deploy** and inspect the build log.

The image includes a health check using `GET /healthz` on port 8080. Coolify uses
an image's Dockerfile health check for Dockerfile applications. If you configure
an equivalent check manually, use HTTP, port `8080`, path `/healthz`, expected
status `200`.

## What the container handles

- Direct visits to `/editor`, tool landing pages and `/platforms/...`, plus the
  exported Next.js navigation payloads. Missing routes return the site's 404
  page with HTTP status 404.
- Security and cross-origin isolation headers generated from `public/_headers`:
  the same Content-Security-Policy as the open-source engine. Nginx does not read
  `_headers` itself; `scripts/generate-nginx-headers.mjs` converts the global
  headers during the image build.
- Revalidation for HTML, navigation data, unversioned public files and `sw.js`;
  one-year immutable caching for hashed Next.js assets and pinned model files.
- Gzip for text assets, correct MIME types and byte ranges for large files.

Keep model URLs versioned if you replace their contents, since `/models/*` is
cached as immutable. The browser also caches assets through `public/sw.js`;
increment its `VERSION` when changing unversioned images or other cached public
assets so returning visitors receive the new files. Avoid proxy/CDN rules that
override cache headers or cache HTML indefinitely.

## Local verification

```bash
npm ci
npm test
npm run lint
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://social9.s4meer.com -t social9:local .
docker run --rm -d --name social9-local -p 8080:8080 social9:local
```

Run the deployment checks against the container. They discover pages from its
sitemap and verify navigation payloads, headers, caching and missing routes:

```bash
npm run check:deployment -- http://localhost:8080
docker inspect --format '{{.State.Health.Status}}' social9-local
docker stop social9-local
```

You can also run `npm run check:deployment -- https://your-domain` after deploying.
`npm start` invokes `next start`, which is for server builds;
use the Docker container to serve this static export in production.

After deployment, open the HTTPS site and check direct visits, editor navigation,
a sample photo, AI model loading and offline access to a previously visited page.
In the browser console, `window.crossOriginIsolated` should be `true`. Model
downloads require access to jsDelivr and Hugging Face, already allowed by the CSP.

## References

- [Coolify Dockerfile deployment](https://coolify.io/docs/applications/builds/dockerfile)
- [Coolify build and runtime variables](https://coolify.io/docs/applications/configuration/environment-variables)
- [Coolify health checks](https://coolify.io/docs/applications/configuration/health-checks)
- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
