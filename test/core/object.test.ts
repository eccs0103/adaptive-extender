import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Object extensions", () => {
	describe("Object.import", () => {
		it("should return the object if valid", () => {
			const obj = { a: 1 };
			expect(Object.import(obj, "[source]")).toBe(obj);
		});

		it("should throw TypeError if source is null", () => {
			expect(() => Object.import(null, "[source]")).toThrow(TypeError);
		});

		it("should throw TypeError if source is not object", () => {
			expect(() => Object.import(42 as any, "[source]")).toThrow(TypeError);
			expect(() => Object.import("str" as any, "[source]")).toThrow(TypeError);
			expect(() => Object.import(undefined as any, "[source]")).toThrow(TypeError);
			expect(() => Object.import(true as any, "[source]")).toThrow(TypeError);
		});

		it("should use custom name in error message", () => {
			expect(() => Object.import(undefined, "customName")).toThrow(/customName/);
		});
	});
});
