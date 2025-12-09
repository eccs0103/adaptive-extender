import "adaptive-extender/core";
import { ImplementationError } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Error extensions", () => {
	describe("Error.from", () => {
		it("should return the same Error instance if input is Error", () => {
			const err = new Error("test");
			const result = Error.from(err);
			expect(result).toBe(err);
		});

		it("should create Error from string reason", () => {
			const result = Error.from("reason");
			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("reason");
		});

		it("should create Error from undefined reason", () => {
			const result = Error.from(undefined);
			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("Undefined reason");
		});

		it("should create Error from null reason", () => {
			const result = Error.from(null);
			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("Undefined reason");
		});

		it("should create Error from object reason", () => {
			const obj = { foo: "bar" };
			const result = Error.from(obj);
			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe(obj.toString());
		});
	});

	describe("Error.prototype.toString", () => {
		it("should return stack if available", () => {
			const err = new Error("msg");
			expect(err.toString()).include("Error: msg");
		});

		it("should return name and message if stack is not available", () => {
			const err = new Error("msg");
			Object.defineProperty(err, "stack", { value: undefined });
			expect(err.toString()).toBe("Error: msg");
		});
	});

	describe("ReferenceError.suppress", () => {
		it("should return value if not null/undefined", () => {
			expect(ReferenceError.suppress(42)).toBe(42);
			expect(ReferenceError.suppress("abc")).toBe("abc");
			expect(ReferenceError.suppress({ a: 1 })).toEqual({ a: 1 });
		});

		it("should throw ReferenceError if value is null", () => {
			expect(() => ReferenceError.suppress(null)).toThrow(ReferenceError);
		});

		it("should throw ReferenceError if value is undefined", () => {
			expect(() => ReferenceError.suppress(undefined)).toThrow(ReferenceError);
		});

		it("should use custom message for null", () => {
			expect(() => ReferenceError.suppress(null, "custom null")).toThrow(/custom null/);
		});

		it("should use custom message for undefined", () => {
			expect(() => ReferenceError.suppress(undefined, "custom undefined")).toThrow(/custom undefined/);
		});
	});

	describe("ImplementationError", () => {
		it("should have correct name and message", () => {
			const err = new ImplementationError();
			expect(err.name).toBe("ImplementationError");
			expect(err.message).toBe("Method not implemented");
		});

		it("should throw TypeError when subclassed", () => {
			class SubError extends ImplementationError { }
			expect(() => new SubError()).toThrow(TypeError);
		});
	});
});
