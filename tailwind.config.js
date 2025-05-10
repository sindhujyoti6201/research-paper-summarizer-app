// // tailwind.config.js
// export default {
//     content: [
//       "./index.html",
//       "./src/**/*.{js,jsx,ts,tsx}"
//     ],
//     theme: {
//       extend: {},
//     },
//     plugins: [],
//   }
  
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./components/**/*.{js,jsx,ts,tsx}",
      "./pages/**/*.{js,jsx,ts,tsx}",
      "./app/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
            primary: '#2563eb',
            secondary: '#14b8a6',
            background: '#f8fafc',    // 👈 this defines bg-background
          },
      },
    },
    plugins: [],
  }
  