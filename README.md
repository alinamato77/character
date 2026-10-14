# Q.alina

A small pixel companion. The live address remains https://small-a-companion.wxie8.chatgpt.site/.

## Project layout

- `public/`: companion HTML, browser scripts, and animation assets. `dist/` is generated Worker build output; do not edit it. The home route serves `public/companion.html`.
- `public/app.js`: named action states, transitions, pointer interactions, and character rendering.
- `public/chat-content.js`: the only file to edit weekly announcements, questions, and companion replies. `public/chat.js` handles the conversation and saving.
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
- Chat: announcement → mood → automatic keyword reply → hangout invitation → availability if Yes → automatic reply → name → sending animation → confirmation. No skips or extra description panels. Closing Chat preserves the current step and draft until the page is refreshed. Only the final Send saves all question answers together; companion replies are never saved.

A new seated action is queued during another seated action or the stand-up transition, avoiding overlapping playback. All rendered frames use a 280 × 350 canvas and a common face-size reference and ground line. Pet and both Hold clip files retain their pre-update bytes. Very short blends soften switches between other clips.

## Updating videos

Place originals in `source-assets/animations/`. Process new website copies into `assets/animations/` (under `public/` in this repository), preserving aspect ratio and matching head size, rather than stretching every pose to the same total height. Update `manifest.json` for renamed or new actions. Do not replace a processed clip with a widescreen original; that would stretch it in the shared canvas. Keep the original Pet and Hold playback copies unless explicitly asked to change them.

The Hold cursor uses the clasped-hands icon on both hand hotspots. While holding, a display-only indicator follows sampled hand positions in `assets/animations/hold-anchors.js`; pointer targets and movement behavior remain independent of the indicator.

The held icon orbits on a limited outer arc 40px from the tracked hand, following pointer direction without covering the fingers or sleeve.

GitHub publishing preference: do not push to GitHub unless the user explicitly requests a push.

## Private answer inbox

- `/inbox` uses a server-side access code stored only in secret `INBOX_ACCESS_CODE`. `INBOX_RATE_SALT` salts rate-limit keys. Anyone with the code can read messages.
- Unlock sessions expire after two hours and use Secure, HttpOnly, SameSite cookies. Lock inbox revokes the session. Unlock attempts are limited to five per network and 100 globally per 15 minutes. Responses are private/no-store.
- Chat submissions require an anonymous session, CSRF token, same-origin request, validated question and answer, and deduplicated submission ID.
- A visitor name is required at the final step and limited to 40 characters; older unnamed answers remain anonymous. The inbox shows the question, answer, name or anonymous label, and Pacific timestamp, with 30 records per page.
- Durable answers and temporary sessions use D1. Applied migrations in `drizzle/` must never be rewritten. Failed saves preserve the full letter for an identical retry. The envelope confirms delivery to the creator inbox, not external email. The scheduling reply is companion dialogue; it does not book a calendar event.
- Build: `npm run build`. Tests: `node tests/interactions.test.cjs`, `node tests/chat.test.cjs`, and `tests/inbox.integration.mjs` against a local Worker with test-only secrets.
- Frontend and server import the same `public/chat-content.js`; no duplicate question list to maintain. Change `edition` when editing questions, then republish. Saved answers retain the original question text.
