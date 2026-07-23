import "adaptive-extender/core";
import { Version, Field, Model } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

class ReleaseModel extends Model {
	@Field(Version)
	version!: Version;
}

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

		it("should default to 0.0.0 when called with no arguments", () => {
			const v = new Version();
			expect(v.major).toBe(0);
			expect(v.minor).toBe(0);
			expect(v.patch).toBe(0);
			expect(v.toString()).toBe("0.0.0");
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

	describe("compare", () => {
		it("should return negative when left major is less than right's", () => {
			expect(Version.compare(new Version(1, 0, 0), new Version(2, 0, 0))).toBeLessThan(0);
		});

		it("should return positive when left major is greater than right's", () => {
			expect(Version.compare(new Version(2, 0, 0), new Version(1, 0, 0))).toBeGreaterThan(0);
		});

		it("should fall through to minor when major components are equal", () => {
			expect(Version.compare(new Version(1, 1, 0), new Version(1, 2, 0))).toBeLessThan(0);
			expect(Version.compare(new Version(1, 2, 0), new Version(1, 1, 0))).toBeGreaterThan(0);
		});

		it("should fall through to patch when major and minor components are equal", () => {
			expect(Version.compare(new Version(1, 1, 1), new Version(1, 1, 2))).toBeLessThan(0);
			expect(Version.compare(new Version(1, 1, 2), new Version(1, 1, 1))).toBeGreaterThan(0);
		});

		it("should return zero for equal versions", () => {
			expect(Version.compare(new Version(1, 2, 3), new Version(1, 2, 3))).toBe(0);
		});

		it("should sort an array into ascending order", () => {
			const versions = [new Version(1, 0, 0), new Version(0, 9, 9), new Version(1, 0, 1), new Version(0, 1, 0)];
			versions.sort(Version.compare);
			expect(versions.map(version => version.toString())).toEqual(["0.1.0", "0.9.9", "1.0.0", "1.0.1"]);
		});
	});

	describe("import", () => {
		it("should create a Version from a valid string", () => {
			const version = Version.import("1.4.0", "field");
			expect(version.major).toBe(1);
			expect(version.minor).toBe(4);
			expect(version.patch).toBe(0);
		});

		it("should throw TypeError if source is not a string", () => {
			expect(() => Version.import(123, "field")).toThrow(TypeError);
			expect(() => Version.import(null, "field")).toThrow(TypeError);
		});

		it("should throw SyntaxError if source cannot be parsed as a version", () => {
			expect(() => Version.import("bad", "field")).toThrow(SyntaxError);
			expect(() => Version.import("1.2", "field")).toThrow(SyntaxError);
		});
	});

	describe("export", () => {
		it("should return the major.minor.patch string", () => {
			expect(Version.export(new Version(1, 2, 3))).toBe("1.2.3");
		});
	});

	describe("PortableConstructor", () => {
		it("should round-trip through @Field(Version)", () => {
			const model = ReleaseModel.import({ version: "1.2.3" }, "release");
			expect(model.version).toBeInstanceOf(Version);
			expect(model.version.toString()).toBe("1.2.3");

			const raw: any = ReleaseModel.export(model);
			expect(raw.version).toBe("1.2.3");
		});
	});
});
