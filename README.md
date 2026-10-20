# Manul Poonia — Portfolio

Single-page portfolio. The hero deals a deck of 34 vertical cards into a fan
while the covers load, then lifts it into a slowly turning wheel rising out
of a cloud bank. React, framer-motion and plain CSS 3D transforms.

```sh
npm install
npm run dev        # dev server
npm run check      # pose math self-check
npm run typecheck
npm run build      # into dist/
```

- Content lives in `src/data.ts`.
- The sky and cloud bank are painted by `scripts/paint-sky.py` (numpy + Pillow) into `src/assets/sky.webp` and `src/assets/clouds.webp`; change its `SEED` for a different sky.
- Card pose math is in `src/pose.ts`; the animation loop, gestures and entrance are in `src/Hero.tsx`.
- To give a card a preview clip, set `video` on its entry in `works`. It plays muted when the card is near the top of the wheel.
- Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`.
