# Cloudflare Analytics Setup

This app uses two Cloudflare analytics paths:

- Cloudflare Web Analytics for page views.
- Workers Analytics Engine for custom interaction events sent to `/api/track`.

## Runtime Event Contract

`functions/api/track.ts` writes to the Analytics Engine binding named `ANALYTICS`.

Dataset: `daily_brief_events`

| Meaning | Analytics Engine field |
|---------|------------------------|
| Event name | `blob1` and `index1` |
| Category | `blob2` |
| Label | `blob3` |
| Page path | `blob4` |
| Client event time | `double1` |

Allowed events:

- `audio_play`
- `card_click`
- `card_share`

## Cloudflare Pages Setup

1. Open Cloudflare Dashboard > Workers & Pages.
2. Select the Brief2Build Pages project.
3. Go to Settings > Variables and Secrets.
4. Add a production build variable:
   - Name: `VITE_CF_ANALYTICS_TOKEN`
   - Value: the token from the Cloudflare Web Analytics JavaScript snippet.
5. Go to Settings > Bindings.
6. Add an Analytics Engine binding:
   - Binding / variable name: `ANALYTICS`
   - Dataset: `daily_brief_events`
7. Redeploy the Pages project. Cloudflare requires a redeploy before new bindings or build-time variables are available to the deployment.

## Web Analytics Token Setup

Recommended path for this repo:

1. Open Cloudflare Dashboard > Web Analytics.
2. Add or manage the site for the production hostname.
3. Copy the token from the JavaScript snippet.
4. Put only the token value in `VITE_CF_ANALYTICS_TOKEN`.

The app injects the beacon at runtime only when `VITE_CF_ANALYTICS_TOKEN` exists, with `spa: true` enabled for React Router navigation tracking.

Do not also rely on Cloudflare Pages one-click automatic snippet injection for the same hostname if `VITE_CF_ANALYTICS_TOKEN` is set, or page views may be counted twice. If you prefer the one-click Pages injection, leave `VITE_CF_ANALYTICS_TOKEN` unset and use only the Cloudflare-injected beacon.

## Verification

After deploy:

1. Visit `/today`.
2. Open browser DevTools > Network.
3. Confirm the Cloudflare beacon script loads from `https://static.cloudflareinsights.com/beacon.min.js`.
4. Click an insight source link or share button, or play an audio brief.
5. Confirm a `POST /api/track` request returns `200`.
6. In Cloudflare Web Analytics, confirm page views appear after a few minutes.
7. Query Analytics Engine after at least one interaction event has been written.

Example SQL API query:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer $CLOUDFLARE_ANALYTICS_READ_TOKEN" \
  --data "SELECT timestamp, blob1 AS event, blob2 AS category, blob3 AS label, blob4 AS page FROM daily_brief_events WHERE timestamp > NOW() - INTERVAL '1' DAY ORDER BY timestamp DESC LIMIT 20"
```

The API token used for this query needs Cloudflare account analytics read permission.

## Local Development Notes

- `npm run dev` serves the Vite app only. Tracking calls may hit a missing `/api/track` route, and the client intentionally swallows failures.
- Unit tests cover the endpoint validation and no-binding no-op path without Wrangler.
- For a closer local Pages Functions smoke test:

```bash
npm run build
npx wrangler pages dev dist --binding VITE_CF_ANALYTICS_TOKEN=<token>
```

Analytics Engine bindings are not available locally, so the endpoint should return `{"ok":true,"noop":true}` unless a mock binding is provided by tests.

## References

- Cloudflare Web Analytics setup: https://developers.cloudflare.com/web-analytics/get-started/
- Cloudflare Web Analytics SPA behavior: https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/
- Cloudflare Pages bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Workers Analytics Engine: https://developers.cloudflare.com/analytics/analytics-engine/get-started/
- Analytics Engine SQL API: https://developers.cloudflare.com/analytics/analytics-engine/sql-api/
