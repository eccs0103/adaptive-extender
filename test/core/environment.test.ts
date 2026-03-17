import "adaptive-extender/core";
import { EnvironmentProvider, Field, Model } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

// --- Models for Testing ---

class AppConfig extends Model {
	@Field(String)
	host!: string;

	@Field(Number)
	port!: number;

	@Field(Boolean)
	debug!: boolean;
}

class OptionalConfig extends Model {
	@Field(String)
	name!: string;
}

describe("EnvironmentProvider", () => {
	describe("resolve", () => {
		it("should import string fields from environment", () => {
			const env = { host: "localhost", port: "8080", debug: "false" };
			const config = EnvironmentProvider.resolve(env, AppConfig);
			expect(config).toBeInstanceOf(AppConfig);
			expect(config.host).toBe("localhost");
		});

		it("should parse numeric string values via JSON.parse", () => {
			const env = { host: "api.example.com", port: "3000", debug: "false" };
			const config = EnvironmentProvider.resolve(env, AppConfig);
			expect(config.port).toBe(3000);
			expect(typeof config.port).toBe("number");
		});

		it("should parse boolean string values via JSON.parse", () => {
			const env = { host: "localhost", port: "80", debug: "true" };
			const config = EnvironmentProvider.resolve(env, AppConfig);
			expect(config.debug).toBe(true);
		});

		it("should return a frozen instance", () => {
			const env = { host: "localhost", port: "80", debug: "true" };
			const config = EnvironmentProvider.resolve(env, AppConfig);
			expect(Object.isFrozen(config)).toBe(true);
		});

		it("should use the model class name as default context path", () => {
			const env = { host: 123 }; // wrong type for 'host' (number, not string)
			expect(() => EnvironmentProvider.resolve(env as any, OptionalConfig))
				.toThrow("OptionalConfig");
		});

		it("should use custom name from options for error context", () => {
			const env = { host: 123 }; // wrong type
			expect(() => EnvironmentProvider.resolve(env as any, OptionalConfig, { name: "myEnv" }))
				.toThrow("myEnv");
		});

		it("should throw when required field is missing", () => {
			const env = { host: "localhost", port: "8080" }; // missing 'debug'
			expect(() => EnvironmentProvider.resolve(env as any, AppConfig)).toThrow(TypeError);
		});
	});
});
