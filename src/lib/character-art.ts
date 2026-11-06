/** Public fictional artwork only. Never infer a real person's appearance from a Persona. */
export function characterArt(character: string) {
  if (character === "demo-calm" || character === "Asha") {
    return { src: "/asha-bookshop.png", position: "50% 10%" };
  }
  return character === "demo-playful" || character === "Mira"
    ? { src: "/mira-portrait.png", position: "50% 10%" }
    : { src: "/chai-date.png", position: "85% 35%" };
}
