# Relationship visuals QA — 2026-11-07

Source visual truth: `.data/visual-design/heart-memory-combined.png` (1487×1058).
Implementation: `.data/visual-design/implemented-desktop-final.png` (1472×1464 full page) and `.data/visual-design/implemented-mobile-final.png` (375×2440 full page).
Browser: Codex IAB; desktop viewport 1487×1058 and mobile 390×844. Captures exclude the 15px scrollbar, at one image pixel per CSS pixel. Full-page height differs because the existing story includes two dialogue paragraphs, three decisions, and a free-text composer. Compare corresponding content regions, not stretched full-page images.

## Comparison and state

Source and final desktop/mobile images were opened together in one comparison input. Production state is chapter 2, immediately after the reunion: familiarity reached, conversation adjusted, remaining dimensions unknown, first memory unlocked. The source contains illustrative statuses; production intentionally displays only surviving evidence. Existing navigation, original Mira artwork, story text, and privacy tools remain available.

## Findings and fixes

- [P2, resolved] First desktop pass used wide oval nodes rather than the reference's round satellites. Capped nodes at 160px with square aspect ratio; final desktop shows round nodes around the pair of avatars.
- [P2, resolved] Mobile English current milestone wrapped Familiarity mid-word. Reduced the mobile label padding and retained the current label on one line. Final mobile capture confirms readable text.
- [P2, resolved] Mobile graph followed the entire conversation with no direct return navigation. Added visible jump-to-graph and return-to-conversation controls and exercised both.
- [P2, resolved] At a chapter pause, the next chapter title/scene appeared prematurely. Displayed step now remains at the completed scene until the next-date action.

## Required fidelity surfaces

- Typography: serif Japanese/English relationship headings, readable body and evidence text, short labels, no clipped controls. Existing app typography retained.
- Layout: portrait/conversation left, heart/compatibility/memories right; mobile stacks them with jump controls. Sticky panel at desktop, normal document flow on mobile. Final capture taken from the document top.
- Colors: cream surface, olive common/adjusted states, terracotta differences and hearts, grey dashed unknown states. Icons and explicit labels distinguish states without color alone.
- Images: original Mira portrait retained; new generated chai/photowalk/photo mementos match warm illustrated palette. Phosphor icons provide hearts and semantic symbols; no mockup raster is used as interactive UI.
- Content: all new copy supports JP/EN. Unknowns remain unknown. Differences are compatible with progress; friendship ending does not fill the special heart. Historical messages retain their original language when changing the UI language.

## Interaction evidence

Browser exercised: first choice, different pace, source-quote panel open/close, invitation/familiarity, next date/adjusted pace, JP/EN, mobile jump and return. Original record survived production server restart. Console error log empty. Mobile document width equals viewport (390px); no horizontal overflow. Unit suite: 26 passed; build and typecheck passed. Unit tests cover deletion of evidence and friendship ending.

## Follow-up polish

P3: richer decorative botanical details and larger satellite illustrations can be added later. The working map uses library icons and the existing Mira portrait to keep labels and states clear. The mock's fake assessments and invented player appearance are deliberately replaced with actual evidence and a generic user icon.

Implementation checklist: heart milestones, four compatibility nodes, inspectable source quotes, three illustrated memory controls, unknown/locked states, JP/EN, mobile navigation, reduced-motion support complete.

final result: passed
