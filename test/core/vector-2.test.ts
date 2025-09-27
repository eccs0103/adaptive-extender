import { Vector, Vector2D } from "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Vector2D", () => {
	describe("constructor", () => {
		it("should set x and y properties", () => {
			const v = new Vector2D(5, 6);
			assert.equal(v.x, 5);
			assert.equal(v.y, 6);
		});

		it("should allow getting and setting x and y", () => {
			const v = new Vector2D(1, 2);
			v.x = 42;
			v.y = 99;
			assert.equal(v.x, 42);
			assert.equal(v.y, 99);
		});
	});

	describe("fromScalar", () => {
		it("should create Vector2D with both components set to scalar", () => {
			const v = Vector2D.fromScalar(7);
			assert.equal(v.x, 7);
			assert.equal(v.y, 7);
		});
	});

	describe("fromVector", () => {
		it("should extract first two metrics from another Vector", () => {
			class DummyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 11; yield 22; yield 33; }
			}
			const v = Vector2D.fromVector(new DummyVector());
			assert.equal(v.x, 11);
			assert.equal(v.y, 22);
		});

		it("should return (0,0) if vector is empty", () => {
			class EmptyVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { /* nothing */ }
			}
			const v = Vector2D.fromVector(new EmptyVector());
			assert.equal(v.x, 0);
			assert.equal(v.y, 0);
		});

		it("should return (first,0) if vector has one value", () => {
			class OneVector extends Vector {
				*[Symbol.iterator](): IteratorObject<number, undefined> { yield 77; }
			}
			const v = Vector2D.fromVector(new OneVector());
			assert.equal(v.x, 77);
			assert.equal(v.y, 0);
		});
	});

	describe("tryParse", () => {
		it("should parse valid string", () => {
			const v = Vector2D.tryParse("(123,456)");
			assert.ok(v instanceof Vector2D);
			assert.equal(v!.x, 123);
			assert.equal(v!.y, 456);
		});

		it("should trim and parse string", () => {
			const v = Vector2D.tryParse("   (42, 99)   ");
			assert.ok(v instanceof Vector2D);
			assert.equal(v!.x, 42);
			assert.equal(v!.y, 99);
		});

		it("should return null for invalid string", () => {
			assert.equal(Vector2D.tryParse("not a vector"), null);
			assert.equal(Vector2D.tryParse("()"), null);
			assert.notEqual(Vector2D.tryParse("(a,b)"), null);
			assert.equal(Vector2D.tryParse("(1,)"), null);
			assert.equal(Vector2D.tryParse("(,2)"), null);
		});

		it("should parse negative and float", () => {
			const v1 = Vector2D.tryParse("(-7.5, 8.25)");
			assert.ok(v1 instanceof Vector2D);
			assert.equal(v1!.x, -7.5);
			assert.equal(v1!.y, 8.25);
		});

		it("should parse NaN", () => {
			const v = Vector2D.tryParse("(NaN,NaN)");
			assert.ok(v instanceof Vector2D);
			assert.ok(Number.isNaN(v!.x));
			assert.ok(Number.isNaN(v!.y));
		});
	});

	describe("parse", () => {
		it("should throw on invalid string", () => {
			assert.throws(() => Vector2D.parse("invalid"), SyntaxError);
		});

		it("should return Vector2D for valid string", () => {
			const v = Vector2D.parse("(8,9)");
			assert.ok(v instanceof Vector2D);
			assert.equal(v.x, 8);
			assert.equal(v.y, 9);
		});
	});

	describe("[Symbol.iterator]", () => {
		it("should yield x and y values", () => {
			const v = new Vector2D(77, 88);
			const arr = Array.from(v);
			assert.deepEqual(arr, [77, 88]);
		});
	});

	describe("presets", () => {
		it("newNaN should have NaN x and y", () => {
			const v = Vector2D.newNaN;
			assert.ok(Number.isNaN(v.x));
			assert.ok(Number.isNaN(v.y));
		});

		it("newZero should have x = 0, y = 0", () => {
			const v = Vector2D.newZero;
			assert.equal(v.x, 0);
			assert.equal(v.y, 0);
		});

		it("newUnitX should have x = 1, y = 0", () => {
			const v = Vector2D.newUnitX;
			assert.equal(v.x, 1);
			assert.equal(v.y, 0);
		});

		it("newUnitY should have x = 0, y = 1", () => {
			const v = Vector2D.newUnitY;
			assert.equal(v.x, 0);
			assert.equal(v.y, 1);
		});

		it("newUnit should have x = 1, y = 1", () => {
			const v = Vector2D.newUnit;
			assert.equal(v.x, 1);
			assert.equal(v.y, 1);
		});
	});
});