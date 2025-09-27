import { Vector, Vector3D } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Vector3D", () => {
	describe("constructor", () => {
		it("should set x, y, z properties", () => {
			const v = new Vector3D(5, 6, 7);
			expect(v.x).toBe(5);
			expect(v.y).toBe(6);
			expect(v.z).toBe(7);
		});

		it("should allow getting and setting x, y, z", () => {
			const v = new Vector3D(1, 2, 3);
			v.x = 42;
			v.y = 99;
			v.z = -7;
			expect(v.x).toBe(42);
			expect(v.y).toBe(99);
			expect(v.z).toBe(-7);
		});
	});

	describe("fromScalar", () => {
		it("should create Vector3D with all components set to scalar", () => {
			const v = Vector3D.fromScalar(7);
			expect(v.x).toBe(7);
			expect(v.y).toBe(7);
			expect(v.z).toBe(7);
		});
	});

	describe("fromVector", () => {
		it("should extract first three metrics from another Vector", () => {
			class DummyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 11; yield 22; yield 33; yield 44; }
			}
			const v = Vector3D.fromVector(new DummyVector());
			expect(v.x).toBe(11);
			expect(v.y).toBe(22);
			expect(v.z).toBe(33);
		});

		it("should return (0,0,0) if vector is empty", () => {
			class EmptyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { /* nothing */ }
			}
			const v = Vector3D.fromVector(new EmptyVector());
			expect(v.x).toBe(0);
			expect(v.y).toBe(0);
			expect(v.z).toBe(0);
		});

		it("should return (first,0,0) if vector has one value", () => {
			class OneVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 77; }
			}
			const v = Vector3D.fromVector(new OneVector());
			expect(v.x).toBe(77);
			expect(v.y).toBe(0);
			expect(v.z).toBe(0);
		});

		it("should return (first,second,0) if vector has two values", () => {
			class TwoVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 1; yield 2; }
			}
			const v = Vector3D.fromVector(new TwoVector());
			expect(v.x).toBe(1);
			expect(v.y).toBe(2);
			expect(v.z).toBe(0);
		});
	});

	describe("tryParse", () => {
		it("should parse valid string", () => {
			const v = Vector3D.tryParse("(123,456,789)");
			expect(v).toBeInstanceOf(Vector3D);
			expect(v!.x).toBe(123);
			expect(v!.y).toBe(456);
			expect(v!.z).toBe(789);
		});

		it("should trim and parse string", () => {
			const v = Vector3D.tryParse("   (42, 99, 101)   ");
			expect(v).toBeInstanceOf(Vector3D);
			expect(v!.x).toBe(42);
			expect(v!.y).toBe(99);
			expect(v!.z).toBe(101);
		});

		it("should return null for invalid string", () => {
			expect(Vector3D.tryParse("not a vector")).toBeNull();
			expect(Vector3D.tryParse("()")).toBeNull();
			expect(Vector3D.tryParse("(a,b,c)")).not.toBeNull();
			expect(Vector3D.tryParse("(1,2,)")).toBeNull();
			expect(Vector3D.tryParse("(,2,3)")).toBeNull();
			expect(Vector3D.tryParse("(1,,3)")).toBeNull();
		});

		it("should parse negative and float", () => {
			const v1 = Vector3D.tryParse("(-7.5, 8.25, 0.5)");
			expect(v1).toBeInstanceOf(Vector3D);
			expect(v1!.x).toBe(-7.5);
			expect(v1!.y).toBe(8.25);
			expect(v1!.z).toBe(0.5);
		});

		it("should parse NaN", () => {
			const v = Vector3D.tryParse("(NaN,NaN,NaN)");
			expect(v).toBeInstanceOf(Vector3D);
			expect(v!.x).toBeNaN();
			expect(v!.y).toBeNaN();
			expect(v!.z).toBeNaN();
		});
	});

	describe("parse", () => {
		it("should throw on invalid string", () => {
			expect(() => Vector3D.parse("invalid")).toThrow(SyntaxError);
		});

		it("should return Vector3D for valid string", () => {
			const v = Vector3D.parse("(8,9,10)");
			expect(v).toBeInstanceOf(Vector3D);
			expect(v.x).toBe(8);
			expect(v.y).toBe(9);
			expect(v.z).toBe(10);
		});
	});

	describe("[Symbol.iterator]", () => {
		it("should yield x, y, z values", () => {
			const v = new Vector3D(77, 88, 99);
			const arr = Array.from(v);
			expect(arr).toEqual([77, 88, 99]);
		});
	});

	describe("presets", () => {
		it("newNaN should have NaN x, y, z", () => {
			const v = Vector3D.newNaN;
			expect(v.x).toBeNaN();
			expect(v.y).toBeNaN();
			expect(v.z).toBeNaN();
		});

		it("newZero should have x = 0, y = 0, z = 0", () => {
			const v = Vector3D.newZero;
			expect(v.x).toBe(0);
			expect(v.y).toBe(0);
			expect(v.z).toBe(0);
		});

		it("newUnitX should have x = 1, y = 0, z = 0", () => {
			const v = Vector3D.newUnitX;
			expect(v.x).toBe(1);
			expect(v.y).toBe(0);
			expect(v.z).toBe(0);
		});

		it("newUnitY should have x = 0, y = 1, z = 0", () => {
			const v = Vector3D.newUnitY;
			expect(v.x).toBe(0);
			expect(v.y).toBe(1);
			expect(v.z).toBe(0);
		});

		it("newUnitZ should have x = 0, y = 0, z = 1", () => {
			const v = Vector3D.newUnitZ;
			expect(v.x).toBe(0);
			expect(v.y).toBe(0);
			expect(v.z).toBe(1);
		});

		it("newUnit should have x = 1, y = 1, z = 1", () => {
			const v = Vector3D.newUnit;
			expect(v.x).toBe(1);
			expect(v.y).toBe(1);
			expect(v.z).toBe(1);
		});
	});
});