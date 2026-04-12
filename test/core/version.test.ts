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
});
