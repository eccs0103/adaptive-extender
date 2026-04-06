import "adaptive-extender/core";
import { Version, Field, Model } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Version", () => {
	describe("constructor", () => {
		it("should create a version from valid components", () => {
			const v = new Version(1, 2, 3);
			expect(v.major).toBe(1);
			expect(v.minor).toBe(2);
			expect(v.patch).toBe(3);
		});

		it("should allow zero components", () => {
			const v = new Version(0, 0, 0);
			expect(v.major).toBe(0);
			expect(v.minor).toBe(0);
			expect(v.patch).toBe(0);
		});

		it("should clamp negative values to zero", () => {
			expect(new Version(-1, 0, 0).major).toBe(0);
			expect(new Version(0, -5, 0).minor).toBe(0);
			expect(new Version(0, 0, -99).patch).toBe(0);
		});

		it("should truncate non-integer finite values", () => {
			expect(new Version(1.9, 0, 0).major).toBe(1);
			expect(new Version(0, 2.7, 0).minor).toBe(2);
			expect(new Version(0, 0, 3.1).patch).toBe(3);
		});

		it("should throw Error for non-finite values", () => {
			expect(() => new Version(NaN, 0, 0)).toThrow(Error);
			expect(() => new Version(0, Infinity, 0)).toThrow(Error);
			expect(() => new Version(0, 0, -Infinity)).toThrow(Error);
		});
	});

	describe("toString", () => {
		it("should return major.minor.patch format", () => {
			expect(new Version(1, 2, 3).toString()).toBe("1.2.3");
			expect(new Version(0, 0, 0).toString()).toBe("0.0.0");
			expect(new Version(10, 20, 30).toString()).toBe("10.20.30");
		});
	});

	describe("tryParse", () => {
		it("should parse valid version strings", () => {
			const v = Version.tryParse("1.2.3");
			expect(v).not.toBeNull();
			expect(v!.major).toBe(1);
			expect(v!.minor).toBe(2);
			expect(v!.patch).toBe(3);
		});

		it("should parse version with leading/trailing whitespace", () => {
			const v = Version.tryParse("  2.0.1  ");
			expect(v).not.toBeNull();
			expect(v!.toString()).toBe("2.0.1");
		});

		it("should return null for invalid strings", () => {
			expect(Version.tryParse("1.2")).toBeNull();
			expect(Version.tryParse("1.2.3.4")).toBeNull();
			expect(Version.tryParse("abc")).toBeNull();
			expect(Version.tryParse("")).toBeNull();
			expect(Version.tryParse("1.2.x")).toBeNull();
		});
	});

	describe("parse", () => {
		it("should parse a valid string", () => {
			const v = Version.parse("3.14.0");
			expect(v.major).toBe(3);
			expect(v.minor).toBe(14);
			expect(v.patch).toBe(0);
		});

		it("should throw SyntaxError for invalid strings", () => {
			expect(() => Version.parse("bad")).toThrow(SyntaxError);
			expect(() => Version.parse("1.2")).toThrow(SyntaxError);
		});
	});

	describe("import", () => {
		it("should import from a valid string", () => {
			const v = Version.import("1.0.0", "test");
			expect(v).toBeInstanceOf(Version);
			expect(v.major).toBe(1);
			expect(v.minor).toBe(0);
			expect(v.patch).toBe(0);
		});

		it("should throw TypeError for non-string source", () => {
			expect(() => Version.import(123, "test")).toThrow(TypeError);
			expect(() => Version.import(null, "test")).toThrow(TypeError);
			expect(() => Version.import(undefined, "test")).toThrow(TypeError);
			expect(() => Version.import({}, "test")).toThrow(TypeError);
		});

		it("should throw TypeError for invalid string", () => {
			expect(() => Version.import("1.2", "test")).toThrow(TypeError);
			expect(() => Version.import("bad", "test")).toThrow(TypeError);
		});
	});

	describe("export", () => {
		it("should export as major.minor.patch string", () => {
			expect(Version.export(new Version(1, 2, 3))).toBe("1.2.3");
		});

		it("should round-trip correctly", () => {
			const original = new Version(2, 10, 5);
			const exported = Version.export(original);
			const imported = Version.import(exported, "rt");
			expect(imported.major).toBe(original.major);
			expect(imported.minor).toBe(original.minor);
			expect(imported.patch).toBe(original.patch);
		});
	});

	describe("used in Model", () => {
		class AppConfig extends Model {
			@Field(Version)
			version!: Version;
		}

		it("should import Version field in model", () => {
			const raw = { version: "2.5.1" };
			const config = AppConfig.import(raw, "config");
			expect(config.version).toBeInstanceOf(Version);
			expect(config.version.major).toBe(2);
			expect(config.version.minor).toBe(5);
			expect(config.version.patch).toBe(1);
		});

		it("should export Version field from model", () => {
			const config = new AppConfig();
			config.version = new Version(1, 0, 0);
			const raw = AppConfig.export(config);
			expect(raw).toEqual({ version: "1.0.0" });
		});
	});
});
