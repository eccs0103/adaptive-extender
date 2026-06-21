import { Random } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Random", () => {
	const random = new Random();

	describe("boolean()", () => {
		it("should return a boolean", () => {
			const value = random.boolean();
			expect(typeof value).toBe("boolean");
		});

		it("should throw if factor is not finite", () => {
			expect(() => random.boolean(Infinity)).toThrow();
			expect(() => random.boolean(NaN)).toThrow();
		});

		it("should throw if factor is out of range", () => {
			expect(() => random.boolean(-0.1)).toThrow(RangeError);
			expect(() => random.boolean(1.1)).toThrow(RangeError);
		});

		it("should respect the factor probability", () => {
			const results = Array.from({ length: 1000 }, () => random.boolean(0.8));
			const trueCount = results.filter(Boolean).length;
			expect(trueCount).toBeGreaterThan(700);
		});
	});

	describe("number()", () => {
		it("should return a number", () => {
			expect(typeof random.number()).toBe("number");
		});

		it("should return a number between 0 and max", () => {
			const value = random.number(10);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(10);
		});

		it("should return a number between min and max", () => {
			const value = random.number(5, 15);
			expect(value).toBeGreaterThanOrEqual(5);
			expect(value).toBeLessThan(15);
		});
	});

	describe("integer()", () => {
		it("should return an integer", () => {
			expect(Number.isInteger(random.integer())).toBe(true);
		});

		it("should return an integer between 0 and max", () => {
			const value = random.integer(10);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(10);
			expect(Number.isInteger(value)).toBe(true);
		});

		it("should return an integer between min and max", () => {
			const value = random.integer(5, 15);
			expect(value).toBeGreaterThanOrEqual(5);
			expect(value).toBeLessThanOrEqual(15);
			expect(Number.isInteger(value)).toBe(true);
		});
	});

	describe("item()", () => {
		it("should return an item from the array", () => {
			const arr = [1, 2, 3];
			const item = random.item(arr);
			expect(arr).toContain(item);
		});

		it("should throw if array is empty", () => {
			expect(() => random.item([])).toThrow();
		});
	});

	describe("subarray()", () => {
		it("should return a shuffled copy of the array", () => {
			const arr = [1, 2, 3, 4];
			const sub = random.subarray(arr);
			expect(sub.sort()).toEqual(arr.sort());
			expect(sub.length).toBe(arr.length);
		});

		it("should return a random subset of given size", () => {
			const arr = [1, 2, 3, 4, 5];
			const sub = random.subarray(arr, 3);
			expect(sub.length).toBe(3);
			sub.forEach(item => expect(arr).toContain(item));
		});

		it("should throw if count is not integer", () => {
			expect(() => random.subarray([1, 2], 1.5)).toThrow();
		});

		it("should throw if count is out of range", () => {
			expect(() => random.subarray([1, 2], -1)).toThrow(RangeError);
			expect(() => random.subarray([1, 2], 3)).toThrow(RangeError);
		});
	});

	describe("shuffle()", () => {
		it("should shuffle the array in place", () => {
			const arr = [1, 2, 3, 4, 5];
			const copy = [...arr];
			random.shuffle(arr as any);
			expect(arr.sort()).toEqual(copy.sort());
		});
	});

	describe("case()", () => {
		it("should select an item based on weights from a map", () => {
			const cases = new Map<string, number>([
				["a", 1],
				["b", 2],
				["c", 7],
			]);
			const result = random.case(cases);
			expect(["a", "b", "c"]).toContain(result);
		});

		it("should accept any iterable of item/weight pairs", () => {
			const cases: ReadonlyArray<readonly [string, number]> = [
				["a", 1],
				["b", 2],
				["c", 7],
			];
			const result = random.case(cases);
			expect(["a", "b", "c"]).toContain(result);
		});

		it("should throw if the iterable yields no items", () => {
			expect(() => random.case(new Map())).toThrow();
			expect(() => random.case([])).toThrow();
		});
	});

	describe("global", () => {
		it("should return the global instance", () => {
			expect(Random.global).toBeInstanceOf(Random);
		});
	});
});
