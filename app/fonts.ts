import localFont from "next/font/local";

export const font = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-100-normal.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-200-normal.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-300-normal.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/poppins/files/poppins-latin-900-normal.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
  display: "swap",
});
