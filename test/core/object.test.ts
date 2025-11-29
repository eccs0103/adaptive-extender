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
});