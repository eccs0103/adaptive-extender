import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Iterator extensions", () => {
	describe("Iterator.range", () => {
		it("should yield integers in [min, max)", () => {
			expect([...Iterator.range(1, 5)]).toEqual([1, 2, 3, 4]);
			expect([...Iterator.range(0, 3)]).toEqual([0, 1, 2]);
		});

		it("should yield nothing when min >= max", () => {
			expect([...Iterator.range(5, 5)]).toEqual([]);
			expect([...Iterator.range(6, 5)]).toEqual([]);
		});

		it("should truncate non-integer bounds", () => {
			expect([...Iterator.range(1.7, 4.9)]).toEqual([1, 2, 3]);
		});

		it("should return a lazy IteratorObject", () => {
			const iter = Iterator.range(0, 100);
			expect(iter.next().value).toBe(0);
			expect(iter.next().value).toBe(1);
		});

		it("should support native iterator helper methods", () => {
			const result = [...Iterator.range(0, 5).filter(n => n % 2 === 0)];
			expect(result).toEqual([0, 2, 4]);
		});
	});

	describe("Iterator.zip", () => {
		it("should zip two arrays into tuples", () => {
			const a = [1, 2, 3];
			const b = ["a", "b", "c"];
			expect([...Iterator.zip(a, b)]).toEqual([[1, "a"], [2, "b"], [3, "c"]]);
		});

		it("should stop at the shortest iterable", () => {
			const a = [1, 2];
			const b = ["x", "y", "z"];
			expect([...Iterator.zip(a, b)]).toEqual([[1, "x"], [2, "y"]]);
		});

		it("should zip more than two iterables", () => {
			const a = [1, 2];
			const b = ["x", "y"];
			const c = [true, false];
			expect([...Iterator.zip(a, b, c)]).toEqual([[1, "x", true], [2, "y", false]]);
		});

		it("should yield nothing when any iterable is empty", () => {
			expect([...Iterator.zip([], [1, 2])]).toEqual([]);
		});

		it("should work with any Iterable, including generators", () => {
			function* gen() { yield 10; yield 20; }
			expect([...Iterator.zip(gen(), [1, 2])]).toEqual([[10, 1], [20, 2]]);
		});

		it("should return a lazy IteratorObject", () => {
			const iter = Iterator.zip([1, 2, 3], ["a", "b", "c"]);
			expect(iter.next().value).toEqual([1, "a"]);
		});
	});
});
