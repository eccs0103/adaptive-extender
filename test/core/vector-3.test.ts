import { Vector, Vector3D } from "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Vector3D", () => {
	describe("constructor", () => {
		it("should set x, y, z properties", () => {
			const v = new Vector3D(5, 6, 7);
			assert.equal(v.x, 5);
			assert.equal(v.y, 6);
			assert.equal(v.z, 7);
		});

		it("should allow getting and setting x, y, z", () => {
			const v = new Vector3D(1, 2, 3);
			v.x = 42;
			v.y = 99;
			v.z = -7;
			assert.equal(v.x, 42);
			assert.equal(v.y, 99);
			assert.equal(v.z, -7);
		});
	});

	describe("fromScalar", () => {
		it("should create Vector3D with all components set to scalar", () => {
			const v = Vector3D.fromScalar(7);
			assert.equal(v.x, 7);
			assert.equal(v.y, 7);
			assert.equal(v.z, 7);
		});
	});

	describe("fromVector", () => {
		it("should extract first three metrics from another Vector", () => {
			class DummyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 11; yield 22; yield 33; yield 44; }
			}
			const v = Vector3D.fromVector(new DummyVector());
			assert.equal(v.x, 11);
			assert.equal(v.y, 22);
			assert.equal(v.z, 33);
		});

		it("should return (0,0,0) if vector is empty", () => {
			class EmptyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { /* nothing */ }
			}
			const v = Vector3D.fromVector(new EmptyVector());
			assert.equal(v.x, 0);
			assert.equal(v.y, 0);
			assert.equal(v.z, 0);
		});

		it("should return (first,0,0) if vector has one value", () => {
			class OneVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 77; }
			}
			const v = Vector3D.fromVector(new OneVector());
			assert.equal(v.x, 77);
			assert.equal(v.y, 0);
			assert.equal(v.z, 0);
		});

		it("should return (first,second,0) if vector has two values", () => {
			class TwoVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 1; yield 2; }
			}
			const v = Vector3D.fromVector(new TwoVector());
			assert.equal(v.x, 1);
			assert.equal(v.y, 2);
			assert.equal(v.z, 0);
		});
	});

	describe("tryParse", () => {
		it("should parse valid string", () => {
			const v = Vector3D.tryParse("(123,456,789)");
			assert.ok(v instanceof Vector3D);
			assert.equal(v!.x, 123);
			assert.equal(v!.y, 456);
			assert.equal(v!.z, 789);
		});

		it("should trim and parse string", () => {
			const v = Vector3D.tryParse("   (42, 99, 101)   ");
			assert.ok(v instanceof Vector3D);
			assert.equal(v!.x, 42);
			assert.equal(v!.y, 99);
			assert.equal(v!.z, 101);
		});

		it("should return null for invalid string", () => {
			assert.equal(Vector3D.tryParse("not a vector"), null);
			assert.equal(Vector3D.tryParse("()"), null);
			assert.notEqual(Vector3D.tryParse("(a,b,c)"), null);
			assert.equal(Vector3D.tryParse("(1,2,)"), null);
			assert.equal(Vector3D.tryParse("(,2,3)"), null);
			assert.equal(Vector3D.tryParse("(1,,3)"), null);
		});

		it("should parse negative and float", () => {
			const v1 = Vector3D.tryParse("(-7.5, 8.25, 0.5)");
			assert.ok(v1 instanceof Vector3D);
			assert.equal(v1!.x, -7.5);
			assert.equal(v1!.y, 8.25);
			assert.equal(v1!.z, 0.5);
		});

		it("should parse NaN", () => {
			const v = Vector3D.tryParse("(NaN,NaN,NaN)");
			assert.ok(v instanceof Vector3D);
			assert.ok(Number.isNaN(v!.x));
			assert.ok(Number.isNaN(v!.y));
			assert.ok(Number.isNaN(v!.z));
		});
	});

	describe("parse", () => {
		it("should throw on invalid string", () => {
			assert.throws(() => Vector3D.parse("invalid"), SyntaxError);
		});

		it("should return Vector3D for valid string", () => {
			const v = Vector3D.parse("(8,9,10)");
			assert.ok(v instanceof Vector3D);
			assert.equal(v.x, 8);
			assert.equal(v.y, 9);
			assert.equal(v.z, 10);
		});
	});

	describe("[Symbol.iterator]", () => {
		it("should yield x, y, z values", () => {
			const v = new Vector3D(77, 88, 99);
			const arr = Array.from(v);
			assert.deepEqual(arr, [77, 88, 99]);
		});
	});

	describe("presets", () => {
		it("newNaN should have NaN x, y, z", () => {
			const v = Vector3D.newNaN;
			assert.ok(Number.isNaN(v.x));
			assert.ok(Number.isNaN(v.y));
			assert.ok(Number.isNaN(v.z));
		});

		it("newZero should have x = 0, y = 0, z = 0", () => {
			const v = Vector3D.newZero;
			assert.equal(v.x, 0);
			assert.equal(v.y, 0);
			assert.equal(v.z, 0);
		});

		it("newUnitX should have x = 1, y = 0, z = 0", () => {
			const v = Vector3D.newUnitX;
			assert.equal(v.x, 1);
			assert.equal(v.y, 0);
			assert.equal(v.z, 0);
		});

		it("newUnitY should have x = 0, y = 1, z = 0", () => {
			const v = Vector3D.newUnitY;
			assert.equal(v.x, 0);
			assert.equal(v.y, 1);
			assert.equal(v.z, 0);
		});

		it("newUnitZ should have x = 0, y = 0, z = 1", () => {
			const v = Vector3D.newUnitZ;
			assert.equal(v.x, 0);
			assert.equal(v.y, 0);
			assert.equal(v.z, 1);
		});

		it("newUnit should have x = 1, y = 1, z = 1", () => {
			const v = Vector3D.newUnit;
			assert.equal(v.x, 1);
			assert.equal(v.y, 1);
			assert.equal(v.z, 1);
		});
	});
});