# bimba

A small pixel companion. The live address remains https://small-a-companion.wxie8.chatgpt.site/.

## Project layout

- `public/`: companion HTML, browser scripts, and animation assets. `dist/` is generated Worker build output; do not edit it. The home route serves `public/companion.html`.
- `public/app.js`: named action states, transitions, pointer interactions, and character rendering.
- `public/questions.js` and `public/chat.js`: 12 questions in a four-week cycle and the Yes/No or text-answer conversation card.
- `public/tips.js`: the five-second footer tip carousel.
- `public/style.css`: the pixel room, buttons, cursors, and responsive layout.
- `public/assets/animations/`: website-ready clips, the action manifest, and sizing measurements.
- `public/assets/icons/`: action buttons; the new clasped-hands icon is Hold and the original hand is Hello.
- `public/assets/cursors/`: pointer icons for hands, petting, and feeding.
- `source-assets/animations/`: original videos, preserved independently of processed playback copies.
- `source-assets/previous-site/`: retired assets retained for recovery; excluded from the served website.
- `tests/interactions.test.cjs`: interaction and transition checks (`node tests/interactions.test.cjs`).

## Action sequences

- Default: standing, strolling, and little hops. A seated break starts every 20 seconds of default activity.
- Rest: sit down → eight seconds seated → stand up → default.
- Feed: sit down if needed → Feed clip → eating clip → stand up → default. Face/neck clicks use the same sequence.
- Pet: the existing animation and 2.6-second interaction, unchanged.
- Hold: the existing left/right clips, one-second hand raise, cursor-following movement, repeat from one second, and click/boundary release, unchanged.
- Hello: sit down if needed → seated wave → stand up → default.
- Chat: one click opens a question card. Three questions per week rotate through four sets, starting October 4, 2026 (visitor local calendar date) and repeating every four weeks. Answers are saved in D1 only after the visitor explicitly submits. The card tells visitors their answer is sent privately to the creator. Eligible opens retain the 45% chance of sit → finger/thinking → stand. Chat never interrupts feeding, greeting, Pet, or Hold.

A new seated action is queued during another seated action or the stand-up transition, avoiding overlapping playback. All rendered frames use a 280 × 350 canvas and a common face-size reference and ground line. Pet and both Hold clip files retain their pre-update bytes. Very short blends soften switches between other clips.

## Updating videos

Place originals in `source-assets/animations/`. Process new website copies into `assets/animations/` (under `public/` in this repository), preserving aspect ratio and matching head size, rather than stretching every pose to the same total height. Update `manifest.json` for renamed or new actions. Do not replace a processed clip with a widescreen original; that would stretch it in the shared canvas. Keep the original Pet and Hold playback copies unless explicitly asked to change them.

The Hold cursor uses the clasped-hands icon on both hand hotspots. While holding, a display-only indicator follows sampled hand positions in `assets/animations/hold-anchors.js`; pointer targets and movement behavior remain independent of the indicator.

The held icon orbits on a limited outer arc 40px from the tracked hand, following pointer direction without covering the fingers or sleeve.

GitHub publishing preference: do not push to GitHub unless the user explicitly requests a push.

## Private answer inbox

- `/inbox` is rendered on the server and only shows records when dispatch-authenticated identity matches the owner email stored in the secret `INBOX_OWNER_EMAIL` environment variable. Anonymous and other signed-in users see no records. Responses are private/no-store.
- Owner sign-in uses the platform `/signin-with-chatgpt` flow. The public companion remains accessible without sign-in.
- `app/api/chat/session` creates a short-lived anonymous session with an HttpOnly cookie and CSRF token. `app/api/chat/answers` validates same-origin POSTs, session token, allowed questions, answer length/type, and submission IDs before saving. The server derives question text from its own question list.
- `db/schema.ts` and generated `drizzle/` migrations define durable answers and temporary visitor sessions. Applied migrations must never be rewritten.
- Retrying a submission reuses its ID to avoid duplicate records. Failed saves preserve visitor input. No email delivery or two-way replies are implemented.
- The inbox shows question, answer, anonymous visitor label, and Pacific timestamp; it paginates 30 answers at a time.
- Build: `npm run build`. Tests: `node tests/interactions.test.cjs`, `node tests/chat.test.cjs`, and the local Worker/database integration in `tests/inbox.integration.mjs` (port 4174, test-only owner identity).
- `lib/question-data.ts` mirrors the public question list for validation; keep them synchronized.
