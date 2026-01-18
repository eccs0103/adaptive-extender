import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Boolean extensions", () => {
	describe("Boolean.import", () => {
		it("should import true as true", () => {
			expect(Boolean.import(true, "[source]")).toBe(true);
		});

		it("should import false as false", () => {
			expect(Boolean.import(false, "[source]")).toBe(false);
		});

		it("should throw TypeError for non-boolean values (number)", () => {
			const value = 1;
			const expectedMessage = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(expectedMessage));
		});

		it("should throw TypeError for non-boolean values (string)", () => {
			const value = "true";
			const expectedMessage = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(expectedMessage));
		});

		it("should throw TypeError for non-boolean values (object)", () => {
			const value = {};
			const expectedMessage = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(expectedMessage));
		});

		it("should throw TypeError for non-boolean values (undefined)", () => {
			const value = undefined;
			const expectedMessage = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(expectedMessage));
		});

		it("should use custom name in error message", () => {
			const value = 0;
			const expectedMessage = `Unable to import boolean from customName due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "customName")).toThrow(new TypeError(expectedMessage));
		});
	});

	describe("Boolean.export", () => {
		it("should export true as true", () => {
			expect(Boolean.export(true)).toBe(true);
		});

		it("should export false as false", () => {
			expect(Boolean.export(false)).toBe(false);
		});
	});
});
