import "adaptive-extender/core";
import { strict as assert } from "assert";

const { abs, split, sqpw, toDegrees, toRadians, PI, meanArithmetic, meanGeometric, meanHarmonic } = Math;

function approxEqual(a: number, b: number, epsilon = Number.EPSILON * 1e8): boolean {
	return abs(a - b) <= epsilon;
}

describe("Number extensions", () => {
	describe("Number.prototype.clamp", () => {
		it("should clamp below minimum", () => {
			assert.strictEqual((1).clamp(2, 5), 2);
		});
		it("should clamp above maximum", () => {
			assert.strictEqual((10).clamp(2, 5), 5);
		});
		it("should return value within range", () => {
			assert.strictEqual((3).clamp(2, 5), 3);
		});
		it("should work with negative numbers", () => {
			assert.strictEqual((-5).clamp(-3, 3), -3);
			assert.strictEqual((0).clamp(-3, 3), 0);
			assert.strictEqual((5).clamp(-3, 3), 3);
		});
	});

	describe("Number.prototype.lerp", () => {
		it("should lerp from [0,10] to [0,1]", () => {
			assert.ok(approxEqual((5).lerp(0, 10), 0.5));
		});
		it("should lerp from [10,20] to [100,200]", () => {
			assert.strictEqual((15).lerp(10, 20, 100, 200), 150);
		});
		it("should throw if min1 == max1", () => {
			assert.throws(() => (5).lerp(1, 1));
		});
		it("should throw if min2 == max2", () => {
			assert.throws(() => (5).lerp(0, 10, 1, 1));
		});
		it("should lerp negative ranges", () => {
			assert.strictEqual((-5).lerp(-10, 0, 0, 100), 50);
		});
	});

	describe("Number.prototype.mod", () => {
		it("should mod within range", () => {
			assert.strictEqual((7).mod(5), 2);
			assert.strictEqual((2).mod(5), 2);
		});
		it("should mod with start offset", () => {
			assert.strictEqual((7).mod(2, 5), 2);
			assert.strictEqual((2).mod(2, 5), 2);
			assert.strictEqual((8).mod(2, 5), 3);
		});
		it("should handle negative numbers", () => {
			assert.strictEqual((-3).mod(5), 2);
			assert.strictEqual((-8).mod(2, 5), 2);
		});
		it("should throw on zero length", () => {
			assert.throws(() => (5).mod(0, 0), RangeError);
		});
	});
});

describe("Math extensions", () => {
	describe("Math.split", () => {
		it("should split positive float", () => {
			const [int, frac] = split(3.14);
			assert.strictEqual(int, 3);
			assert.ok(approxEqual(frac, 0.14));
		});
		it("should split negative float", () => {
			const [int, frac] = split(-2.5);
			assert.strictEqual(int, -2);
			assert.ok(approxEqual(frac, -0.5));
		});
		it("should split integer", () => {
			assert.deepStrictEqual(split(7), [7, 0]);
		});
		it("should split zero", () => {
			assert.deepStrictEqual(split(0), [0, 0]);
		});
	});

	describe("Math.sqpw", () => {
		it("should square positive number", () => {
			assert.strictEqual(sqpw(3), 9);
		});
		it("should square negative number", () => {
			assert.strictEqual(sqpw(-4), 16);
		});
		it("should square zero", () => {
			assert.strictEqual(sqpw(0), 0);
		});
	});

	describe("Math.toDegrees", () => {
		it("should convert PI radians to degrees", () => {
			assert.ok(approxEqual(toDegrees(PI), 180));
		});
		it("should convert 0 radians to degrees", () => {
			assert.strictEqual(toDegrees(0), 0);
		});
		it("should convert negative radians to degrees", () => {
			assert.ok(approxEqual(toDegrees(-PI), -180));
		});
	});

	describe("Math.toRadians", () => {
		it("should convert 180 degrees to PI radians", () => {
			assert.ok(approxEqual(toRadians(180), PI));
		});
		it("should convert 0 degrees to radians", () => {
			assert.strictEqual(toRadians(0), 0);
		});
		it("should convert negative degrees to radians", () => {
			assert.ok(approxEqual(toRadians(-180), -PI));
		});
	});

	describe("Math.meanArithmetic", () => {
		it("should calculate mean of positive numbers", () => {
			assert.strictEqual(meanArithmetic(1, 2, 3, 4), 2.5);
		});
		it("should calculate mean of negative numbers", () => {
			assert.strictEqual(meanArithmetic(-1, -2, -3), -2);
		});
		it("should calculate mean of mixed numbers", () => {
			assert.strictEqual(meanArithmetic(-1, 1), 0);
		});
		it("should calculate mean of single value", () => {
			assert.strictEqual(meanArithmetic(42), 42);
		});
	});

	describe("Math.meanGeometric", () => {
		it("should calculate geometric mean of positive numbers", () => {
			assert.ok(approxEqual(meanGeometric(1, 4, 16), 4));
		});
		it("should calculate geometric mean of single value", () => {
			assert.strictEqual(meanGeometric(9), 9);
		});
		it("should return 0 if any value is 0", () => {
			assert.strictEqual(meanGeometric(0, 4, 16), 0);
		});
		it("should return NaN for negative values", () => {
			assert.ok(Number.isNaN(meanGeometric(-1, 4)));
		});
	});

	describe("Math.meanHarmonic", () => {
		it("should calculate harmonic mean of positive numbers", () => {
			assert.ok(approxEqual(meanHarmonic(1, 2, 4), 12 / 7));
		});
		it("should calculate harmonic mean of single value", () => {
			assert.strictEqual(meanHarmonic(5), 5);
		});
		it("should return NaN if any value is 0", () => {
			assert.ok(Number.isNaN(meanHarmonic(1, 0, 2)));
		});
		it("should handle negative values", () => {
			assert.ok(approxEqual(meanHarmonic(-1, -2), -1.3333333333333333));
		});
	});
});