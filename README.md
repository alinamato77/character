# bimba

A small pixel companion. The live address remains https://small-a-companion.wxie8.chatgpt.site/.

## Project layout

- `dist/`: the complete, publishable website. The desktop copy has these files at its root.
- `dist/app.js`: named action states, transitions, pointer interactions, and character rendering.
- `dist/questions.js` and `dist/chat.js`: 12 questions in a four-week cycle and the Yes/No or text-answer conversation card.
- `dist/tips.js`: the five-second footer tip carousel.
- `dist/style.css`: the pixel room, buttons, cursors, and responsive layout.
- `dist/assets/animations/`: website-ready clips, the action manifest, and sizing measurements.
- `dist/assets/icons/`: action buttons; the new clasped-hands icon is Hold and the original hand is Hello.
- `dist/assets/cursors/`: pointer icons for hands, petting, and feeding.
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
- Chat: one click opens a question card. Three questions per week rotate through four sets, starting October 4, 2026 (visitor local calendar date) and repeating every four weeks. Text answers are not persisted or sent anywhere. Eligible opens retain the 45% chance of sit → finger/thinking → stand. Chat never interrupts feeding, greeting, Pet, or Hold.

A new seated action is queued during another seated action or the stand-up transition, avoiding overlapping playback. All rendered frames use a 280 × 350 canvas and a common face-size reference and ground line. Pet and both Hold clip files retain their pre-update bytes. Very short blends soften switches between other clips.

## Updating videos

Place originals in `source-assets/animations/`. Process new website copies into `assets/animations/` (under `dist/` in this repository), preserving aspect ratio and matching head size, rather than stretching every pose to the same total height. Update `manifest.json` for renamed or new actions. Do not replace a processed clip with a widescreen original; that would stretch it in the shared canvas. Keep the original Pet and Hold playback copies unless explicitly asked to change them.

The Hold cursor uses the clasped-hands icon on both hand hotspots. While holding, a display-only indicator follows sampled hand positions in `assets/animations/hold-anchors.js`; pointer targets and movement behavior remain independent of the indicator.
