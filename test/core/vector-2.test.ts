import { Vector, Vector2D } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Vector2D", () => {
	describe("constructor", () => {
		it("should set x and y properties", () => {
			const v = new Vector2D(5, 6);
			expect(v.x).toBe(5);
			expect(v.y).toBe(6);
		});

		it("should allow getting and setting x and y", () => {
			const v = new Vector2D(1, 2);
			v.x = 42;
			v.y = 99;
			expect(v.x).toBe(42);
			expect(v.y).toBe(99);
		});
	});

	describe("fromScalar", () => {
		it("should create Vector2D with both components set to scalar", () => {
			const v = Vector2D.fromScalar(7);
			expect(v.x).toBe(7);
			expect(v.y).toBe(7);
		});
	});

	describe("fromVector", () => {
		it("should extract first two metrics from another Vector", () => {
			class DummyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 11; yield 22; yield 33; }
			}
			const v = Vector2D.fromVector(new DummyVector());
			expect(v.x).toBe(11);
			expect(v.y).toBe(22);
		});

		it("should return (0,0) if vector is empty", () => {
			class EmptyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { /* nothing */ }
			}
			const v = Vector2D.fromVector(new EmptyVector());
			expect(v.x).toBe(0);
			expect(v.y).toBe(0);
		});

		it("should return (first,0) if vector has one value", () => {
			class OneVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 77; }
			}
			const v = Vector2D.fromVector(new OneVector());
			expect(v.x).toBe(77);
			expect(v.y).toBe(0);
		});
	});

	describe("tryParse", () => {
		it("should parse valid string", () => {
			const v = Vector2D.tryParse("(123,456)");
			expect(v).toBeInstanceOf(Vector2D);
			expect(v!.x).toBe(123);
			expect(v!.y).toBe(456);
		});

		it("should trim and parse string", () => {
			const v = Vector2D.tryParse("   (42, 99)   ");
			expect(v).toBeInstanceOf(Vector2D);
			expect(v!.x).toBe(42);
			expect(v!.y).toBe(99);
		});

		it("should return null for invalid string", () => {
			expect(Vector2D.tryParse("not a vector")).toBeNull();
			expect(Vector2D.tryParse("()")).toBeNull();
			expect(Vector2D.tryParse("(a,b)")).not.toBeNull();
			expect(Vector2D.tryParse("(1,)")).toBeNull();
			expect(Vector2D.tryParse("(,2)")).toBeNull();
		});

		it("should parse negative and float", () => {
			const v1 = Vector2D.tryParse("(-7.5, 8.25)");
			expect(v1).toBeInstanceOf(Vector2D);
			expect(v1!.x).toBe(-7.5);
			expect(v1!.y).toBe(8.25);
		});

		it("should parse NaN", () => {
			const v = Vector2D.tryParse("(NaN,NaN)");
			expect(v).toBeInstanceOf(Vector2D);
			expect(v!.x).toBeNaN();
			expect(v!.y).toBeNaN();
		});
	});

	describe("parse", () => {
		it("should throw on invalid string", () => {
			expect(() => Vector2D.parse("invalid")).toThrow(SyntaxError);
		});

		it("should return Vector2D for valid string", () => {
			const v = Vector2D.parse("(8,9)");
			expect(v).toBeInstanceOf(Vector2D);
			expect(v.x).toBe(8);
			expect(v.y).toBe(9);
		});
	});

	describe("[Symbol.iterator]", () => {
		it("should yield x and y values", () => {
			const v = new Vector2D(77, 88);
			const arr = Array.from(v);
			expect(arr).toEqual([77, 88]);
		});
	});

	describe("presets", () => {
		it("newNaN should have NaN x and y", () => {
			const v = Vector2D.newNaN;
			expect(v.x).toBeNaN();
			expect(v.y).toBeNaN();
		});

		it("newZero should have x = 0, y = 0", () => {
			const v = Vector2D.newZero;
			expect(v.x).toBe(0);
			expect(v.y).toBe(0);
		});

		it("newUnitX should have x = 1, y = 0", () => {
			const v = Vector2D.newUnitX;
			expect(v.x).toBe(1);
			expect(v.y).toBe(0);
		});

		it("newUnitY should have x = 0, y = 1", () => {
			const v = Vector2D.newUnitY;
			expect(v.x).toBe(0);
			expect(v.y).toBe(1);
		});

		it("newUnit should have x = 1, y = 1", () => {
			const v = Vector2D.newUnit;
			expect(v.x).toBe(1);
			expect(v.y).toBe(1);
		});
	});
});