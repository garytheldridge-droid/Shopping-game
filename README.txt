SHOPPING GAME V4.1

Home-flow update: prominent START SHOPPING CTA, Trending, Quests, More for you, and another endless-shop CTA. Existing feed-ready V4 architecture retained.

SHOPPING GAME V4 — FEED-READY PROTOTYPE

What V4 changes:
- Catalogue is no longer hard-coded into the UI.
- Products are loaded from mock-catalog.json in pages.
- Infinite-scroll style loading (30 at a time).
- Category filtering and broad search.
- Product schema includes retailer, source and affiliateUrl.
- If affiliateUrl exists, a subtle VIEW REAL ITEM button appears.
- Delivery timing depends on product type.
- Orders progress while you are away.
- Notification centre + browser notifications where allowed.
- Delivered items go into My Bag.
- Returns refund 80% of the virtual price.
- Current demo feed contains 240 placeholder records so the architecture can be tested before Awin feed approval.

The production catalogue format expected by the app:
{
  "id": "unique-product-id",
  "name": "Product title",
  "price": 49.99,
  "currency": "GBP",
  "category": "Fashion",
  "retailer": "Retailer Name",
  "delivery": "today | tomorrow | local | later",
  "image": "https://...",
  "affiliateUrl": "https://...",
  "source": "awin",
  "tags": ["pink","trainers","fashion"]
}

When the first Awin programme is approved, the next step is to build an importer that maps its feed into this format. The UI should then work without a redesign.

GitHub Pages:
Upload all four web files together (index.html, styles.css, app.js, fallback-catalog.js, mock-catalog.json) to the repo root.
