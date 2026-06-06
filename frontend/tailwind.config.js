/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        rito: {
          night: "#0B2A2E",
          deep: "#0D4A52",
          ocean: "#0E7A8A",
          compass: "#14A8BD",
          mist: "#7DD4DF",
          frost: "#C8EFF4",
          amber: "#F2B84B",
          "amber-d": "#C47D0E",
          slate: "#F7F9FA",
          elevated: "#0D3A40",
          error: "#E24B4A",
        },
      },
      fontFamily: {
        display: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
        sans: ["DM Sans", "sans-serif"],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
      },
    },
  },
};
