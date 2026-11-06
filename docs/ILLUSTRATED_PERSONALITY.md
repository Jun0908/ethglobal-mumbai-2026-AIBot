# Illustrated personality selection

Six optional self-selected tendencies follow the six photo themes: first meeting, once close, relationship pace, receiving care, planning and repairing differences. Every item has `It depends` and can be skipped. After three personality cards the player can jump to preview; the existing photo-only early preview remains. Six illustrated summary cards allow direct edit and return. Changes clear the previous preview and approval. Legacy three/six-photo saves default to empty personality choices.

Choices are strictly validated IDs, stored with the encrypted owner capsule, restored for owner-only editing, and mapped deterministically to contextual behavioral examples and existing persona fields. Photo preferences do not infer personality. First-meeting and once-close behavior stay distinct in AI instructions. Receiving-care preferences are not claims about what the partner has done. AI output is still a simulation, not a prediction of a person's feelings.

Verification: 36 unit tests; production build/typecheck; live public-HTTPS API test `scripts/check-personality.mjs` covers six choices, malformed option rejection, English generation, owner isolation, approval, same-ID edits and legacy defaults. Browser checks cover all six JP cards, JP live preview, EN/mobile 390px with no horizontal overflow, local draft restoration, edits invalidating preview/consent, and empty console errors. The Cloudflare URL stays local in ignored `.data/cloudflare-url.txt`.

## Artwork

Generated with the built-in image generation tool, one call per asset. Optimized to 1000px-wide WebP via Sharp for delivery; originals remain in the Codex generated_images directory. No CLI image-generation fallback used.

Final assets:

- C:/Users/j-kawai/Desktop/AI Bot/public/personality-first-meeting.webp
- C:/Users/j-kawai/Desktop/AI Bot/public/personality-close-friends.webp
- C:/Users/j-kawai/Desktop/AI Bot/public/personality-romance-pace.webp
- C:/Users/j-kawai/Desktop/AI Bot/public/personality-care.webp
- C:/Users/j-kawai/Desktop/AI Bot/public/personality-planning.webp
- C:/Users/j-kawai/Desktop/AI Bot/public/personality-repair.webp

Exact shared prompt template (replace `{id}` and `{scene}` using the list below):

```
Use case: illustration-story. Asset type: a single landscape editorial illustration for the {id} personality selection step in the LOVE MATCH MASALA app. Primary scene: {scene} Style: refined hand-painted anime editorial watercolor/gouache, delicate ink lines, textured warm ivory paper, contemporary Mumbai atmosphere, terracotta, muted rose and teal accents, expressive natural adult faces. Framing: horizontal 3:2, waist-up or medium shot, both adults centered with breathing room and softly detailed background, readable at small card size. No text, letters, words, numbers, speech bubbles, UI, logos or watermark. One coherent scene only, no collage. Fully clothed adults, tasteful everyday Indian clothing.
```

- **first-meeting** — Two fictional Indian adults in their late twenties meeting at a cozy cafe table for the first time, one offering a friendly greeting while the other listens with a gentle shy smile. Show different comfortable ways of starting conversation, equal dignity.
- **close-friends** — Two fictional Indian adults in their late twenties sharing a spontaneous laugh on a park bench, relaxed close conversation and playful warm expressions, tea cups beside them. Becoming more open after getting to know someone.
- **romance-pace** — Two fictional Indian adults in their late twenties walking together along a waterfront at sunset, comfortable respectful space between them, shy eye contact, one holding a small flower. A relationship growing at its own pace.
- **care** — Two fictional Indian adults in their late twenties at a small cafe table, one thoughtfully remembering the other's favorite tea and offering it, the other looking pleasantly touched. Warm everyday affection and attentive listening.
- **planning** — Two fictional Indian adults in their late twenties planning a day out together at a cafe, an unfolded illustrated city map and simple postcards on the table, both pointing to ideas with curious cheerful expressions. Shared decision making.
- **repair** — Two fictional Indian adults in their late twenties sitting face to face on a quiet garden bench after a small disagreement, one gently explaining with open hands and the other listening thoughtfully, calm respectful expressions, hopeful reconnection.
