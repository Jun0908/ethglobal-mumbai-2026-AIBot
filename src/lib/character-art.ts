/** Public fictional artwork only. Never infer a real person's appearance from a Persona. */
export function characterArt(character: string) {
  return character === "demo-playful" || character === "Mira"
    ? { src: "/mira-portrait.png", position: "50% 10%" }
    : { src: "/chai-date.png", position: "85% 35%" };
}
