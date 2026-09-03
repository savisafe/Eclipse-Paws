# Web release

## Production build

```bash
npm ci
npm run check
npm run test:e2e
npm run build
npm run preview -- --host 0.0.0.0
```

Deploy the contents of `dist/` to any static HTTPS host. SPA fallback must serve `index.html` for
unknown navigation paths. No server, environment variables, CDN or runtime network dependency is
required.

## PWA

The production client registers `/sw.js` after `load`. The service worker pre-caches the shell and
runtime-caches same-origin assets after first use. `manifest.webmanifest` requests standalone
landscape display and includes 192/512 icons.

When changing cached shell behavior, increment `CACHE_NAME` in `public/sw.js`.

## Release checklist

- Run the full quality gate on desktop and mobile viewports.
- Verify a fresh install, one online launch, then an offline reload.
- Confirm day/night contrast, keyboard focus, touch areas and reduced motion.
- Confirm audio starts only after interaction and backgrounding pauses gameplay.
- Inspect the largest lazy assets and avoid importing every level background at startup.
