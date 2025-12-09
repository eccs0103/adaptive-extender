import { Vector, Vector1D } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Vector1D", () => {
	describe("constructor", () => {
		it("should set x property", () => {
			const v = new Vector1D(5);
			expect(v.x).toBe(5);
		});

		it("should allow getting and setting x", () => {
			const v = new Vector1D(1);
			v.x = 42;
			expect(v.x).toBe(42);
		});
	});

	describe("fromScalar", () => {
		it("should create Vector1D with given scalar", () => {
			const v = Vector1D.fromScalar(7);
			expect(v.x).toBe(7);
		});
	});

	describe("fromVector", () => {
		it("should extract first metric from another Vector", () => {
			class DummyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 99; yield 100; }
			}
			const v = Vector1D.fromVector(new DummyVector());
			expect(v.x).toBe(99);
		});

		it("should return zero if vector is empty", () => {
			class EmptyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { /* nothing */ }
			}
			const v = Vector1D.fromVector(new EmptyVector());
			expect(v.x).toBe(0);
		});
	});

	describe("tryParse", () => {
		it("should parse valid string", () => {
			const v = Vector1D.tryParse("(123)");
			expect(v).toBeInstanceOf(Vector1D);
			expect(v!.x).toBe(123);
		});

		it("should trim and parse string", () => {
			const v = Vector1D.tryParse("   (42)   ");
			expect(v).toBeInstanceOf(Vector1D);
			expect(v!.x).toBe(42);
		});

		it("should return null for invalid string", () => {
			expect(Vector1D.tryParse("not a vector")).toBeNull();
			expect(Vector1D.tryParse("()")).toBeNull();
			expect(Vector1D.tryParse("(a)")).not.toBeNull();
		});

		it("should parse negative and float", () => {
			const v1 = Vector1D.tryParse("(-7.5)");
			expect(v1).toBeInstanceOf(Vector1D);
			expect(v1!.x).toBe(-7.5);
		});

		it("should parse NaN", () => {
			const v = Vector1D.tryParse("(NaN)");
			expect(v).toBeInstanceOf(Vector1D);
			expect(v!.x).toBeNaN();
		});
	});

	describe("parse", () => {
		it("should throw on invalid string", () => {
			expect(() => Vector1D.parse("invalid")).toThrow(SyntaxError);
		});

		it("should return Vector1D for valid string", () => {
			const v = Vector1D.parse("(8)");
			expect(v).toBeInstanceOf(Vector1D);
			expect(v.x).toBe(8);
		});
	});

	describe("[Symbol.iterator]", () => {
		it("should yield x value", () => {
			const v = new Vector1D(77);
			const arr = Array.from(v);
			expect(arr).toEqual([77]);
		});
	});

	describe("presets", () => {
		it("newNaN should have NaN x", () => {
			const v = Vector1D.newNaN;
			expect(v.x).toBeNaN();
		});

		it("newZero should have x = 0", () => {
			const v = Vector1D.newZero;
			expect(v.x).toBe(0);
		});

		it("newUnitX should have x = 1", () => {
			const v = Vector1D.newUnitX;
			expect(v.x).toBe(1);
		});

		it("newUnit should have x = 1", () => {
			const v = Vector1D.newUnit;
			expect(v.x).toBe(1);
		});
	});
});
