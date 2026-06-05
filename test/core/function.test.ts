import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Function extensions", () => {
	describe("empty", () => {
		it("should be a function", () => {
			expect(typeof Function.empty).toBe("function");
		});

		it("should return undefined when called", () => {
			expect(Function.empty()).toBeUndefined();
		});

		it("should be the same reference on repeated access", () => {
			expect(Function.empty).toBe(Function.empty);
		});

		it("should not be writable", () => {
			const original = Function.empty;
			try { (Function as any).empty = () => 42; } catch { /* strict mode throws */ }
			expect(Function.empty).toBe(original);
		});
	});
});
