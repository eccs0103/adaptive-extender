import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("BigInt", () => {
	describe("import", () => {
		it("should import from a valid string", () => {
			expect(BigInt.import("42", "test")).toBe(42n);
			expect(BigInt.import("0", "test")).toBe(0n);
			expect(BigInt.import("-7", "test")).toBe(-7n);
		});

		it("should import very large values that exceed Number range", () => {
			const large = "99999999999999999999999999999999";
			expect(BigInt.import(large, "test")).toBe(BigInt(large));
		});

		it("should throw TypeError for non-string source", () => {
			expect(() => BigInt.import(42, "test")).toThrow(TypeError);
			expect(() => BigInt.import(true, "test")).toThrow(TypeError);
			expect(() => BigInt.import(null, "test")).toThrow(TypeError);
			expect(() => BigInt.import(undefined, "test")).toThrow(TypeError);
			expect(() => BigInt.import({}, "test")).toThrow(TypeError);
		});
	});

	describe("export", () => {
		it("should export bigint as string", () => {
			expect(BigInt.export(42n)).toBe("42");
			expect(BigInt.export(0n)).toBe("0");
			expect(BigInt.export(-7n)).toBe("-7");
		});

		it("should preserve full precision for large values", () => {
			const large = 99999999999999999999999999999999n;
			expect(BigInt.export(large)).toBe("99999999999999999999999999999999");
		});

		it("should round-trip correctly", () => {
			const values = [0n, 1n, -1n, 9007199254740993n, -9007199254740993n];
			for (const value of values) {
				expect(BigInt.import(BigInt.export(value), "rt")).toBe(value);
			}
		});
	});
});
