import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		react(),
		tsconfigPaths(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon.png"],
			manifest: {
				name: "Dakiya — Local-first API toolkit",
				short_name: "Dakiya",
				description:
					"Local-first API client. No accounts. No cloud. Your requests stay on your machine.",
				theme_color: "#1a7f5a",
				background_color: "#f8f9fa",
				display: "standalone",
				orientation: "landscape",
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "icon-512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				// Only cache app shell — never cache API calls
				globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
				navigateFallback: null,
				runtimeCaching: [],
			},
			devOptions: {
				enabled: false,
			},
		}),
	],
	server: {
		port: 4242,
		strictPort: true,
	},
});
