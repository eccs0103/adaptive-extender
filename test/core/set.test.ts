import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Set extensions", () => {
	describe("Set.prototype.toggle", () => {
		it("should add a missing value and return true", () => {
			const set = new Set<number>();
			const result = set.toggle(1);
			expect(result).toBe(true);
			expect(set.has(1)).toBe(true);
		});

		it("should remove a present value and return false", () => {
			const set = new Set<number>([1]);
			const result = set.toggle(1);
			expect(result).toBe(false);
			expect(set.has(1)).toBe(false);
		});

		it("should force-add a value with force=true when absent", () => {
			const set = new Set<number>();
			const result = set.toggle(5, true);
			expect(result).toBe(true);
			expect(set.has(5)).toBe(true);
		});

		it("should force-add and return true even when value is already present", () => {
			const set = new Set<number>([5]);
			const result = set.toggle(5, true);
			expect(result).toBe(true);
			expect(set.has(5)).toBe(true);
		});

		it("should force-remove a value with force=false when present", () => {
			const set = new Set<number>([5]);
			const result = set.toggle(5, false);
			expect(result).toBe(false);
			expect(set.has(5)).toBe(false);
		});

		it("should force-remove and return false even when value is absent", () => {
			const set = new Set<number>();
			const result = set.toggle(5, false);
			expect(result).toBe(false);
			expect(set.has(5)).toBe(false);
		});
	});
});
