import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		projects: [
			{
				test: {
					name: "core",
					environment: "node",
					include: ["test/core/**/*.test.ts"],
				},
			},
			{
				test: {
					name: "web",
					environment: "jsdom",
					include: ["test/web/**/*.test.ts"],
				},
			},
			{
				test: {
					name: "worker",
					environment: "node",
					include: ["test/worker/**/*.test.ts"],
				},
			},
		],
	},
});
