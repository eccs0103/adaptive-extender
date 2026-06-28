import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Array extensions", () => {
	describe("Array.import", () => {
		it("should import an array", () => {
			const arr = [1, 2, 3];
			expect(Array.import(arr, "[source]")).toEqual(arr);
		});

		it.each([123, "abc", {}, null, undefined])("should throw TypeError for non-array source: %s", (source) => {
			expect(() => Array.import(source as any, "[source]")).toThrow(TypeError);
		});
	});

	describe("Array.export", () => {
		it("should export an array as-is", () => {
			const arr = [1, 2, 3];
			expect(Array.export(arr)).toEqual(arr);
		});
	});

	describe("Array.range", () => {
		it("should create a range of integers", () => {
			expect(Array.range(1, 5)).toEqual([1, 2, 3, 4]);
			expect(Array.range(0, 3)).toEqual([0, 1, 2]);
		});

		it("should handle min >= max", () => {
			expect(Array.range(5, 5)).toEqual([]);
			expect(Array.range(6, 5)).toEqual([]);
		});

		it("should truncate non-integer min/max", () => {
			expect(Array.range(1.7, 4.9)).toEqual([1, 2, 3]);
		});
	});

describe("Array.fromAsync", () => {
		it("should create an array from an async iterable", async () => {
			async function* asyncGen() {
				yield 1;
				yield 2;
				yield 3;
			}
			const result = await Array.fromAsync(asyncGen());
			expect(result).toEqual([1, 2, 3]);
		});

		it("should create an array from a sync iterable", async () => {
			function* syncGen() {
				yield "a";
				yield "b";
			}
			const result = await Array.fromAsync(syncGen());
			expect(result).toEqual(["a", "b"]);
		});

		it("should use a mapper function", async () => {
			async function* asyncGen() {
				yield 1;
				yield 2;
			}
			const result = await Array.fromAsync(asyncGen(), (x) => x * 2);
			expect(result).toEqual([2, 4]);
		});

		it("should use a mapper function returning a promise", async () => {
			async function* asyncGen() {
				yield 1;
				yield 2;
			}
			const result = await Array.fromAsync(asyncGen(), async (x) => x * 2);
			expect(result).toEqual([2, 4]);
		});

		it("should use context with mapper", async () => {
			const context = { multiplier: 3 };
			async function* asyncGen() {
				yield 1;
				yield 2;
			}
			const result = await Array.fromAsync(asyncGen(), function (this: typeof context, x) {
				return x * this.multiplier;
			}, context);
			expect(result).toEqual([3, 6]);
		});
	});

	describe("Array.prototype.swap", () => {
		it("should swap two elements", () => {
			const arr = [1, 2, 3];
			arr.swap(0, 2);
			expect(arr).toEqual([3, 2, 1]);
		});

		it("should truncate indices", () => {
			const arr = [10, 20, 30];
			arr.swap(0.9, 2.7);
			expect(arr).toEqual([30, 20, 10]);
		});
	});

	describe("Array.prototype.resize", () => {
		it("should extend array and fill with default", () => {
			const arr = [1, 2];
			arr.resize(4, 0);
			expect(arr).toEqual([1, 2, 0, 0]);
		});

		it("should shrink array", () => {
			const arr = [1, 2, 3, 4];
			arr.resize(2, 0);
			expect(arr).toEqual([1, 2]);
		});

		it("should do nothing if length is unchanged", () => {
			const arr = [1, 2, 3];
			arr.resize(3, 0);
			expect(arr).toEqual([1, 2, 3]);
		});
	});

	describe("Array.prototype.remove", () => {
		it("should remove the first occurrence and return true", () => {
			const arr = [1, 2, 3];
			const result = arr.remove(2);
			expect(result).toBe(true);
			expect(arr).toEqual([1, 3]);
		});

		it("should return false when value is not found", () => {
			const arr = [1, 2, 3];
			const result = arr.remove(99);
			expect(result).toBe(false);
			expect(arr).toEqual([1, 2, 3]);
		});

		it("should remove only the first occurrence of a duplicate", () => {
			const arr = [1, 2, 2, 3];
			arr.remove(2);
			expect(arr).toEqual([1, 2, 3]);
		});

		it("should return false on empty array", () => {
			const arr: number[] = [];
			expect(arr.remove(1)).toBe(false);
		});
	});
});
