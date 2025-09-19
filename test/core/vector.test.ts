import { Vector } from "adaptive-extender/core";
import { strict as assert } from "assert";
import { describe, it } from "mocha";

// Minimal concrete subclass for testing
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
			assert.throws(() => new (Vector as any)(), TypeError);
		});
		it("should not throw when subclassed", () => {
			assert.doesNotThrow(() => new TestVector([1, 2, 3]));
		});
		it("should be iterable", () => {
			const v = new TestVector([1, 2, 3]);
			assert.deepEqual([...v], [1, 2, 3]);
		});
	});

	describe("map", () => {
		it("should transform values", () => {
			const v = new TestVector([1, 2, 3]);
			assert.deepEqual([...v.map((x) => x * 2)], [2, 4, 6]);
		});
	});

	describe("filter", () => {
		it("should filter values", () => {
			const v = new TestVector([1, 2, 3, 4]);
			assert.deepEqual([...v.filter((x) => x % 2 === 0)], [2, 4]);
		});
	});

	describe("flatMap", () => {
		it("should flatten mapped results", () => {
			const v = new TestVector([1, 2]);
			assert.deepEqual([...v.flatMap((x) => [x, x])], [1, 1, 2, 2]);
		});
	});

	describe("reduce", () => {
		it("should sum values without initial", () => {
			const v = new TestVector([1, 2, 3]);
			assert.equal(v.reduce((a, b) => a + b), 6);
		});
		it("should sum values with initial", () => {
			const v = new TestVector([1, 2, 3]);
			assert.equal(v.reduce((a, b) => a + b, 10), 16);
		});
		it("should throw on empty without initial", () => {
			const v = new TestVector([]);
			assert.throws(() => v.reduce((a, b) => a + b));
		});
	});

	describe("forEach", () => {
		it("should call callback for every element", () => {
			const v = new TestVector([1, 2, 3]);
			let sum = 0;
			v.forEach((x) => (sum += x));
			assert.equal(sum, 6);
		});
	});

	describe("some", () => {
		it("should return true if any element matches", () => {
			const v = new TestVector([1, 2, 3]);
			assert.ok(v.some((x) => x === 2));
		});
		it("should return false if no element matches", () => {
			const v = new TestVector([1, 2, 3]);
			assert.ok(!v.some((x) => x === 99));
		});
	});

	describe("every", () => {
		it("should return true if all match", () => {
			const v = new TestVector([1, 2, 3]);
			assert.ok(v.every((x) => x > 0));
		});
		it("should return false if any fails", () => {
			const v = new TestVector([1, 2, -1]);
			assert.ok(!v.every((x) => x > 0));
		});
	});

	describe("find", () => {
		it("should return first matching element", () => {
			const v = new TestVector([1, 2, 3]);
			assert.equal(v.find((x) => x > 1), 2);
		});
		it("should return undefined if not found", () => {
			const v = new TestVector([1, 2, 3]);
			assert.equal(v.find((x) => x > 10), undefined);
		});
	});

	describe("validators", () => {
		it("isNaN should check all values", () => {
			assert.ok(Vector.isNaN(new TestVector([NaN, NaN])));
			assert.ok(!Vector.isNaN(new TestVector([NaN, 1])));
		});
		it("isFinite should check all values", () => {
			assert.ok(Vector.isFinite(new TestVector([1, 2])));
			assert.ok(!Vector.isFinite(new TestVector([1, Infinity])));
		});
		it("isInteger should check all values", () => {
			assert.ok(Vector.isInteger(new TestVector([1, 2])));
			assert.ok(!Vector.isInteger(new TestVector([1.5, 2])));
		});
		it("isSafeInteger should check all values", () => {
			assert.ok(Vector.isSafeInteger(new TestVector([1, 2])));
			assert.ok(!Vector.isSafeInteger(new TestVector([Number.MAX_SAFE_INTEGER + 1])));
		});
	});

	describe("insteadNaN", () => {
		it("should replace with fallback if all NaN", () => {
			const v = new TestVector([NaN, NaN]);
			assert.equal(v.insteadNaN("X"), "X");
		});
		it("should return itself if not all NaN", () => {
			const v = new TestVector([NaN, 1]);
			assert.equal(v.insteadNaN("X"), v);
		});
	});

	describe("insteadInfinity", () => {
		it("should replace with fallback if contains Infinity", () => {
			const v = new TestVector([Infinity]);
			assert.equal(v.insteadInfinity("Y"), "Y");
		});
		it("should return itself if finite", () => {
			const v = new TestVector([1]);
			assert.equal(v.insteadInfinity("Y"), v);
		});
	});

	describe("insteadZero", () => {
		it("should replace with fallback if all zero", () => {
			const v = new TestVector([0, 0]);
			assert.equal(v.insteadZero("Z"), "Z");
		});
		it("should return itself if not all zero", () => {
			const v = new TestVector([0, 1]);
			assert.equal(v.insteadZero("Z"), v);
		});
	});

	describe("toFixed", () => {
		it("should format numbers with digits", () => {
			const v = new TestVector([1.23, 4.56]);
			assert.equal(v.toFixed(1), "(1.2, 4.6)");
		});
	});

	describe("toExponential", () => {
		it("should format numbers in exponential notation", () => {
			const v = new TestVector([1.23, 4.56]);
			assert.equal(v.toExponential(1), "(1.2e+0, 4.6e+0)");
		});
	});

	describe("toPrecision", () => {
		it("should format numbers with given precision", () => {
			const v = new TestVector([1.23, 4.56]);
			assert.equal(v.toPrecision(2), "(1.2, 4.6)");
		});
	});

	describe("toString", () => {
		it("should default to decimal string", () => {
			const v = new TestVector([1, 2]);
			assert.equal(v.toString(), "(1, 2)");
		});
		it("should respect radix", () => {
			const v = new TestVector([10, 15]);
			assert.equal(v.toString(16), "(a, f)");
		});
	});

	describe("toLocaleString", () => {
		it("should format numbers using locale", () => {
			const v = new TestVector([1234.56]);
			const str = v.toLocaleString("en-US", { maximumFractionDigits: 1 });
			assert.ok(str.startsWith("(") && str.endsWith(")"));
		});
	});
});
