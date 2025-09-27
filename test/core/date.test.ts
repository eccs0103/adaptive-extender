import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Date extensions", () => {
	describe("Date.import", () => {
		it("should import a valid Date instance", () => {
			const d = new Date();
			expect(Date.import(d)).toBe(d);
		});

		it("should throw TypeError for non-Date values", () => {
			expect(() => Date.import("2024-01-01" as any)).toThrow(TypeError);
			expect(() => Date.import(123 as any)).toThrow(TypeError);
			expect(() => Date.import(null as any)).toThrow(TypeError);
			expect(() => Date.import(undefined as any)).toThrow(TypeError);
			expect(() => Date.import({} as any)).toThrow(TypeError);
		});

		it("should include the name in the error message", () => {
			expect(() => Date.import("not a date" as any, "customName")).toThrow(/customName/);
		});
	});

	describe("Date.isInvalid", () => {
		it("should return false for non-Date values", () => {
			expect(Date.isInvalid("2024-01-01")).toBe(false);
			expect(Date.isInvalid(123)).toBe(false);
			expect(Date.isInvalid(null)).toBe(false);
			expect(Date.isInvalid(undefined)).toBe(false);
			expect(Date.isInvalid({})).toBe(false);
		});

		it("should return false for valid Date", () => {
			const d = new Date();
			expect(Date.isInvalid(d)).toBe(false);
		});

		it("should return true for invalid Date", () => {
			const d = new Date("invalid-date");
			expect(Date.isInvalid(d)).toBe(true);
		});
	});

	describe("Date.prototype.insteadInvalid", () => {
		it("should return itself if valid", () => {
			const d = new Date();
			expect(d.insteadInvalid("fallback")).toBe(d);
		});

		it("should return fallback if invalid", () => {
			const d = new Date("invalid-date");
			const fallback = "fallback";
			expect(d.insteadInvalid(fallback)).toBe(fallback);
		});

		it("should work with different fallback types", () => {
			const d = new Date("invalid-date");
			expect(d.insteadInvalid(123)).toBe(123);
			expect(d.insteadInvalid({ a: 1 })).toEqual({ a: 1 });
		});
	});
});