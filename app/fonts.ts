import { Poppins } from "next/font/google";

export const font = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

// export const font = Merriweather({
//   subsets: ["latin"],
//   weight: ["300", "400", "700", "900"],
//   variable: "--font-merriweather",
// });
