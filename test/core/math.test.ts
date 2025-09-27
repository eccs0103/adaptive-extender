import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

const { split, sqpw, toDegrees, toRadians, PI, meanArithmetic, meanGeometric, meanHarmonic } = Math;

describe("Number extensions", () => {
	describe("Number.prototype.clamp", () => {
		it("should clamp below minimum", () => {
			expect((1).clamp(2, 5)).toBe(2);
		});
		it("should clamp above maximum", () => {
			expect((10).clamp(2, 5)).toBe(5);
		});
		it("should return value within range", () => {
			expect((3).clamp(2, 5)).toBe(3);
		});
		it("should work with negative numbers", () => {
			expect((-5).clamp(-3, 3)).toBe(-3);
			expect((0).clamp(-3, 3)).toBe(0);
			expect((5).clamp(-3, 3)).toBe(3);
		});
	});

	describe("Number.prototype.lerp", () => {
		it("should lerp from [0,10] to [0,1]", () => {
			expect((5).lerp(0, 10)).toBeCloseTo(0.5);
		});
		it("should lerp from [10,20] to [100,200]", () => {
			expect((15).lerp(10, 20, 100, 200)).toBe(150);
		});
		it("should throw if min1 == max1", () => {
			expect(() => (5).lerp(1, 1)).toThrow();
		});
		it("should throw if min2 == max2", () => {
			expect(() => (5).lerp(0, 10, 1, 1)).toThrow();
		});
		it("should lerp negative ranges", () => {
			expect((-5).lerp(-10, 0, 0, 100)).toBe(50);
		});
	});

	describe("Number.prototype.mod", () => {
		it("should mod within range", () => {
			expect((7).mod(5)).toBe(2);
			expect((2).mod(5)).toBe(2);
		});
		it("should mod with start offset", () => {
			expect((7).mod(2, 5)).toBe(2);
			expect((2).mod(2, 5)).toBe(2);
			expect((8).mod(2, 5)).toBe(3);
		});
		it("should handle negative numbers", () => {
			expect((-3).mod(5)).toBe(2);
			expect((-8).mod(2, 5)).toBe(2);
		});
		it("should throw on zero length", () => {
			expect(() => (5).mod(0, 0)).toThrow(RangeError);
		});
	});
});

describe("Math extensions", () => {
	describe("split", () => {
		it("should split positive float", () => {
			const [int, frac] = split(3.14);
			expect(int).toBe(3);
			expect(frac).toBeCloseTo(0.14);
		});
		it("should split negative float", () => {
			const [int, frac] = split(-2.5);
			expect(int).toBe(-2);
			expect(frac).toBeCloseTo(-0.5);
		});
		it("should split integer", () => {
			expect(split(7)).toEqual([7, 0]);
		});
		it("should split zero", () => {
			expect(split(0)).toEqual([0, 0]);
		});
	});

	describe("sqpw", () => {
		it("should square positive number", () => {
			expect(sqpw(3)).toBe(9);
		});
		it("should square negative number", () => {
			expect(sqpw(-4)).toBe(16);
		});
		it("should square zero", () => {
			expect(sqpw(0)).toBe(0);
		});
	});

	describe("toDegrees", () => {
		it("should convert PI radians to degrees", () => {
			expect(toDegrees(PI)).toBeCloseTo(180);
		});
		it("should convert 0 radians to degrees", () => {
			expect(toDegrees(0)).toBe(0);
		});
		it("should convert negative radians to degrees", () => {
			expect(toDegrees(-PI)).toBeCloseTo(-180);
		});
	});

	describe("toRadians", () => {
		it("should convert 180 degrees to PI radians", () => {
			expect(toRadians(180)).toBeCloseTo(PI);
		});
		it("should convert 0 degrees to radians", () => {
			expect(toRadians(0)).toBe(0);
		});
		it("should convert negative degrees to radians", () => {
			expect(toRadians(-180)).toBeCloseTo(-PI);
		});
	});

	describe("meanArithmetic", () => {
		it("should calculate mean of positive numbers", () => {
			expect(meanArithmetic(1, 2, 3, 4)).toBe(2.5);
		});
		it("should calculate mean of negative numbers", () => {
			expect(meanArithmetic(-1, -2, -3)).toBe(-2);
		});
		it("should calculate mean of mixed numbers", () => {
			expect(meanArithmetic(-1, 1)).toBe(0);
		});
		it("should calculate mean of single value", () => {
			expect(meanArithmetic(42)).toBe(42);
		});
	});

	describe("meanGeometric", () => {
		it("should calculate geometric mean of positive numbers", () => {
			expect(meanGeometric(1, 4, 16)).toBeCloseTo(4);
		});
		it("should calculate geometric mean of single value", () => {
			expect(meanGeometric(9)).toBe(9);
		});
		it("should return 0 if any value is 0", () => {
			expect(meanGeometric(0, 4, 16)).toBe(0);
		});
		it("should return NaN for negative values", () => {
			expect(meanGeometric(-1, 4)).toBeNaN();
		});
	});

	describe("meanHarmonic", () => {
		it("should calculate harmonic mean of positive numbers", () => {
			expect(meanHarmonic(1, 2, 4)).toBeCloseTo(12 / 7);
		});
		it("should calculate harmonic mean of single value", () => {
			expect(meanHarmonic(5)).toBe(5);
		});
		it("should return NaN if any value is 0", () => {
			expect(meanHarmonic(1, 0, 2)).toBeNaN();
		});
		it("should handle negative values", () => {
			expect(meanHarmonic(-1, -2)).toBeCloseTo(-4 / 3);
		});
	});
});