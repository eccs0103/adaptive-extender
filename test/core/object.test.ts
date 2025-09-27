import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Object extensions", () => {
	describe("Object.import", () => {
		it("should return the object if valid", () => {
			const obj = { a: 1 };
			expect(Object.import(obj)).toBe(obj);
		});

		it("should throw TypeError if source is null", () => {
			expect(() => Object.import(null)).toThrow(TypeError);
		});

		it("should throw TypeError if source is not object", () => {
			expect(() => Object.import(42 as any)).toThrow(TypeError);
			expect(() => Object.import("str" as any)).toThrow(TypeError);
			expect(() => Object.import(undefined as any)).toThrow(TypeError);
			expect(() => Object.import(true as any)).toThrow(TypeError);
		});

		it("should use custom name in error message", () => {
			expect(() => Object.import(undefined, "customName")).toThrow(/customName/);
		});
	});

	describe("Object.map", () => {
		it("should apply callback if value is non-null/non-undefined", () => {
			const result = Object.map(5, v => v * 2);
			expect(result).toBe(10);
		});

		it("should return value unchanged if null", () => {
			const result = Object.map(null as number | null, v => v * 2);
			expect(result).toBeNull();
		});

		it("should return value unchanged if undefined", () => {
			const result = Object.map(undefined as number | undefined, v => v * 2);
			expect(result).toBeUndefined();
		});

		it("should work with objects", () => {
			const obj = { x: 1 };
			const result = Object.map(obj, o => ({ ...o, y: 2 }));
			expect(result).toEqual({ x: 1, y: 2 });
		});
	});
});