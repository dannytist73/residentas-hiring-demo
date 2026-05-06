import { Cormorant_Garamond, Inter } from "next/font/google";

export const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display-var",
});

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-var",
});
