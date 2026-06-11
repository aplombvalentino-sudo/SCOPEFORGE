import { Space_Grotesk, Manrope, JetBrains_Mono } from "next/font/google";

/** Display — headlines, KPIs, marketing type. Geometric, technical. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/** Body — UI text. Refined, humanist, decisively not Inter. */
export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

/** Mono — numbers, ids, micro-labels, technical metadata. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const fontClasses = `${spaceGrotesk.variable} ${manrope.variable} ${jetbrainsMono.variable}`;
