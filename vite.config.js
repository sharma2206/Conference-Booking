import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        react({
            jsxRuntime: "automatic",
        }),
        tailwindcss(),
        laravel({
            input: ["resources/css/app.css", "resources/js/main.jsx"],
            refresh: true,
        }),
    ],
    server: {
        host: 'localhost',
        watch: {
            ignored: ["**/storage/framework/views/**"],
        },
    },
});
