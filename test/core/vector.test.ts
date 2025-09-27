import { Vector } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

class TestVector extends Vector {
	#data: number[];
	constructor(data: number[]) {
		super();
		this.#data = data;
	}
	*[Symbol.iterator](): IteratorObject<number, undefined> {
		for (const v of this.#data) yield v;
	}
}

describe("Vector", () => {
	describe("constructor", () => {
		it("should throw when instantiated directly", () => {
			expect(() => new (Vector as any)()).toThrow(TypeError);
		});
		it("should not throw when subclassed", () => {
			expect(() => new TestVector([1, 2, 3])).not.toThrow();
		});
		it("should be iterable", () => {
			const v = new TestVector([1, 2, 3]);
			expect([...v]).toEqual([1, 2, 3]);
		});
	});

	describe("map", () => {
		it("should transform values", () => {
			const v = new TestVector([1, 2, 3]);
			expect([...v.map((x) => x * 2)]).toEqual([2, 4, 6]);
		});
	});

	describe("filter", () => {
		it("should filter values", () => {
			const v = new TestVector([1, 2, 3, 4]);
			expect([...v.filter((x) => x % 2 === 0)]).toEqual([2, 4]);
		});
	});

	describe("flatMap", () => {
		it("should flatten mapped results", () => {
			const v = new TestVector([1, 2]);
			expect([...v.flatMap((x) => [x, x])]).toEqual([1, 1, 2, 2]);
		});
	});

	describe("reduce", () => {
		it("should sum values without initial", () => {
			const v = new TestVector([1, 2, 3]);
			expect(v.reduce((a, b) => a + b)).toBe(6);
		});
		it("should sum values with initial", () => {
			const v = new TestVector([1, 2, 3]);
			expect(v.reduce((a, b) => a + b, 10)).toBe(16);
		});
		it("should throw on empty without initial", () => {
			const v = new TestVector([]);
			expect(() => v.reduce((a, b) => a + b)).toThrow();
		});
	});

	describe("forEach", () => {
		it("should call callback for every element", () => {
			const v = new TestVector([1, 2, 3]);
			let sum = 0;
			v.forEach((x) => (sum += x));
			expect(sum).toBe(6);
		});
	});

	describe("some", () => {
		it("should return true if any element matches", () => {
			const v = new TestVector([1, 2, 3]);
			expect(v.some((x) => x === 2)).toBe(true);
		});
		it("should return false if no element matches", () => {
			const v = new TestVector([1, 2, 3]);
			expect(v.some((x) => x === 99)).toBe(false);
		});
	});

	describe("every", () => {
		it("should return true if all match", () => {
			const v = new TestVector([1, 2, 3]);
			expect(v.every((x) => x > 0)).toBe(true);
		});
		it("should return false if any fails", () => {
			const v = new TestVector([1, 2, -1]);
			expect(v.every((x) => x > 0)).toBe(false);
		});
	});

	describe("find", () => {
		it("should return first matching element", () => {
			const v = new TestVector([1, 2, 3]);
			expect(v.find((x) => x > 1)).toBe(2);
		});
		it("should return undefined if not found", () => {
			const v = new TestVector([1, 2, 3]);
			expect(v.find((x) => x > 10)).toBeUndefined();
		});
	});

	describe("validators", () => {
		it("isNaN should check all values", () => {
			expect(Vector.isNaN(new TestVector([NaN, NaN]))).toBe(true);
			expect(Vector.isNaN(new TestVector([NaN, 1]))).toBe(false);
		});
		it("isFinite should check all values", () => {
			expect(Vector.isFinite(new TestVector([1, 2]))).toBe(true);
			expect(Vector.isFinite(new TestVector([1, Infinity]))).toBe(false);
		});
		it("isInteger should check all values", () => {
			expect(Vector.isInteger(new TestVector([1, 2]))).toBe(true);
			expect(Vector.isInteger(new TestVector([1.5, 2]))).toBe(false);
		});
		it("isSafeInteger should check all values", () => {
			expect(Vector.isSafeInteger(new TestVector([1, 2]))).toBe(true);
			expect(Vector.isSafeInteger(new TestVector([Number.MAX_SAFE_INTEGER + 1]))).toBe(false);
		});
	});

	describe("insteadNaN", () => {
		it("should replace with fallback if all NaN", () => {
			const v = new TestVector([NaN, NaN]);
			expect(v.insteadNaN("X")).toBe("X");
		});
		it("should return itself if not all NaN", () => {
			const v = new TestVector([NaN, 1]);
			expect(v.insteadNaN("X")).toBe(v);
		});
	});

	describe("insteadInfinity", () => {
		it("should replace with fallback if contains Infinity", () => {
			const v = new TestVector([Infinity]);
			expect(v.insteadInfinity("Y")).toBe("Y");
		});
		it("should return itself if finite", () => {
			const v = new TestVector([1]);
			expect(v.insteadInfinity("Y")).toBe(v);
		});
	});

	describe("insteadZero", () => {
		it("should replace with fallback if all zero", () => {
			const v = new TestVector([0, 0]);
			expect(v.insteadZero("Z")).toBe("Z");
		});
		it("should return itself if not all zero", () => {
			const v = new TestVector([0, 1]);
			expect(v.insteadZero("Z")).toBe(v);
		});
	});

	describe("toFixed", () => {
		it("should format numbers with digits", () => {
			const v = new TestVector([1.23, 4.56]);
			expect(v.toFixed(1)).toBe("(1.2, 4.6)");
		});
	});

	describe("toExponential", () => {
		it("should format numbers in exponential notation", () => {
			const v = new TestVector([1.23, 4.56]);
			expect(v.toExponential(1)).toBe("(1.2e+0, 4.6e+0)");
		});
	});

	describe("toPrecision", () => {
		it("should format numbers with given precision", () => {
			const v = new TestVector([1.23, 4.56]);
			expect(v.toPrecision(2)).toBe("(1.2, 4.6)");
		});
	});

	describe("toString", () => {
		it("should default to decimal string", () => {
			const v = new TestVector([1, 2]);
			expect(v.toString()).toBe("(1, 2)");
		});
		it("should respect radix", () => {
			const v = new TestVector([10, 15]);
			expect(v.toString(16)).toBe("(a, f)");
		});
	});

	describe("toLocaleString", () => {
		it("should format numbers using locale", () => {
			const v = new TestVector([1234.56]);
			const str = v.toLocaleString("en-US", { maximumFractionDigits: 1 });
			expect(str.startsWith("(")).toBe(true);
			expect(str.endsWith(")")).toBe(true);
		});
	});
});