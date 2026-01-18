import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Number extensions", () => {
	describe("Number.import", () => {
		it("should import a valid number", () => {
			expect(Number.import(42, "[source]")).toBe(42);
			expect(Number.import(-3.14, "[source]")).toBe(-3.14);
		});

		it("should throw TypeError for non-number types", () => {
			expect(() => Number.import("42" as any, "[source]")).toThrow(TypeError);
			expect(() => Number.import(null as any, "[source]")).toThrow(TypeError);
			expect(() => Number.import(undefined as any, "[source]")).toThrow(TypeError);
			expect(() => Number.import({} as any, "[source]")).toThrow(TypeError);
			expect(() => Number.import([] as any, "[source]")).toThrow(TypeError);
			expect(() => Number.import(true as any, "[source]")).toThrow(TypeError);
		});

		it("should use custom name in error message", () => {
			expect(() => Number.import("not-a-number" as any, "customName")).toThrow(/customName/);
		});
	});

	describe("Number.export", () => {
		it("should export a number as-is", () => {
			expect(Number.export(42)).toBe(42);
			expect(Number.export(-3.14)).toBe(-3.14);
		});
	});

	describe("Number.prototype.insteadNaN", () => {
		it("should return fallback for NaN", () => {
			expect((NaN as number).insteadNaN("fallback")).toBe("fallback");
		});

		it("should return original number if not NaN", () => {
			expect((5 as number).insteadNaN("fallback")).toBe(5);
			expect((0 as number).insteadNaN("fallback")).toBe(0);
		});
	});

	describe("Number.prototype.insteadInfinity", () => {
		it("should return fallback for NaN", () => {
			expect((NaN as number).insteadInfinity("fallback")).toBe("fallback");
		});

		it("should return fallback for Infinity", () => {
			expect((Infinity as number).insteadInfinity("fallback")).toBe("fallback");
			expect((-Infinity as number).insteadInfinity("fallback")).toBe("fallback");
		});

		it("should return original number if finite", () => {
			expect((42 as number).insteadInfinity("fallback")).toBe(42);
			expect((0 as number).insteadInfinity("fallback")).toBe(0);
		});
	});

	describe("Number.prototype.insteadZero", () => {
		it("should return fallback for zero", () => {
			expect((0 as number).insteadZero("fallback")).toBe("fallback");
		});

		it("should return original number if not zero", () => {
			expect((1 as number).insteadZero("fallback")).toBe(1);
			expect((-1 as number).insteadZero("fallback")).toBe(-1);
			expect((3.14 as number).insteadZero("fallback")).toBe(3.14);
		});
	});
});
