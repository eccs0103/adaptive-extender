import { defineConfig } from "vitest/config";
import babel from "@rolldown/plugin-babel";

const pluginDecorators = babel({
	plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]],
});

export default defineConfig({
	test: {
		globals: true,
		projects: [
			{
				plugins: [pluginDecorators],
				test: {
					name: "core",
					environment: "node",
					include: ["test/core/**/*.test.ts"],
				},
			},
			{
				plugins: [pluginDecorators],
				test: {
					name: "web",
					environment: "jsdom",
					include: ["test/web/**/*.test.ts"],
				},
			},
			{
				plugins: [pluginDecorators],
				test: {
					name: "worker",
					environment: "node",
					include: ["test/worker/**/*.test.ts"],
				},
			},
		],
	},
});
