/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      height: {
        'screen-dvh': ['100dvh', '100lvh'], // Usa `dvh` para incluir el viewport dinámico
      },
    },
  },
  plugins: [require("daisyui")], // Agrega DaisyUI aquí
}