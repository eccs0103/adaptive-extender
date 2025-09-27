import { Vector, Vector1D } from "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Vector1D", () => {
	describe("constructor", () => {
		it("should set x property", () => {
			const v = new Vector1D(5);
			assert.equal(v.x, 5);
		});

		it("should allow getting and setting x", () => {
			const v = new Vector1D(1);
			v.x = 42;
			assert.equal(v.x, 42);
		});
	});

	describe("fromScalar", () => {
		it("should create Vector1D with given scalar", () => {
			const v = Vector1D.fromScalar(7);
			assert.equal(v.x, 7);
		});
	});

	describe("fromVector", () => {
		it("should extract first metric from another Vector", () => {
			class DummyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 99; yield 100; }
			}
			const v = Vector1D.fromVector(new DummyVector());
			assert.equal(v.x, 99);
		});

		it("should return zero if vector is empty", () => {
			class EmptyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { /* nothing */ }
			}
			const v = Vector1D.fromVector(new EmptyVector());
			assert.equal(v.x, 0);
		});
	});

	describe("tryParse", () => {
		it("should parse valid string", () => {
			const v = Vector1D.tryParse("(123)");
			assert.ok(v instanceof Vector1D);
			assert.equal(v!.x, 123);
		});

		it("should trim and parse string", () => {
			const v = Vector1D.tryParse("   (42)   ");
			assert.ok(v instanceof Vector1D);
			assert.equal(v!.x, 42);
		});

		it("should return null for invalid string", () => {
			assert.equal(Vector1D.tryParse("not a vector"), null);
			assert.equal(Vector1D.tryParse("()"), null);
			assert.notEqual(Vector1D.tryParse("(a)"), null);
		});

		it("should parse negative and float", () => {
			const v1 = Vector1D.tryParse("(-7.5)");
			assert.ok(v1 instanceof Vector1D);
			assert.equal(v1!.x, -7.5);
		});

		it("should parse NaN", () => {
			const v = Vector1D.tryParse("(NaN)");
			assert.ok(v instanceof Vector1D);
			assert.ok(Number.isNaN(v!.x));
		});
	});

	describe("parse", () => {
		it("should throw on invalid string", () => {
			assert.throws(() => Vector1D.parse("invalid"), SyntaxError);
		});

		it("should return Vector1D for valid string", () => {
			const v = Vector1D.parse("(8)");
			assert.ok(v instanceof Vector1D);
			assert.equal(v.x, 8);
		});
	});

	describe("[Symbol.iterator]", () => {
		it("should yield x value", () => {
			const v = new Vector1D(77);
			const arr = Array.from(v);
			assert.deepEqual(arr, [77]);
		});
	});

	describe("presets", () => {
		it("newNaN should have NaN x", () => {
			const v = Vector1D.newNaN;
			assert.ok(Number.isNaN(v.x));
		});

		it("newZero should have x = 0", () => {
			const v = Vector1D.newZero;
			assert.equal(v.x, 0);
		});

		it("newUnitX should have x = 1", () => {
			const v = Vector1D.newUnitX;
			assert.equal(v.x, 1);
		});

		it("newUnit should have x = 1", () => {
			const v = Vector1D.newUnit;
			assert.equal(v.x, 1);
		});
	});
});