/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#f59e0b', // Amber-500 equivalent, can be adjusted
                secondary: '#1e3a8a', // Dark blue
            },
        },
    },
    plugins: [],
}
