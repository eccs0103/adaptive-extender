import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("String extensions", () => {
	describe("String.import", () => {
		it("should return the string if valid", () => {
			expect(String.import("hello")).toBe("hello");
		});

		it("should throw TypeError if source is not a string", () => {
			expect(() => String.import(123 as any)).toThrow(TypeError);
			expect(() => String.import({} as any, "obj")).toThrow(TypeError);
			expect(() => String.import(null as any, "null")).toThrow(TypeError);
			expect(() => String.import(undefined as any, "undef")).toThrow(TypeError);
		});

		it("should use custom name in error message", () => {
			expect(() => String.import(42 as any, "customName")).toThrow(/customName/);
		});
	});

	describe("String.empty", () => {
		it("should be an empty string", () => {
			expect(String.empty).toBe("");
		});

		it("should be immutable", () => {
			expect(() => { (String as any).empty = "not empty"; }).toThrow();
		});
	});

	describe("String.isEmpty", () => {
		it("should return true for empty string", () => {
			expect(String.isEmpty("")).toBe(true);
		});

		it("should return false for non-empty string", () => {
			expect(String.isEmpty("abc")).toBe(false);
		});
	});

	describe("String.isWhitespace", () => {
		it("should return true for empty string", () => {
			expect(String.isWhitespace("")).toBe(true);
		});

		it("should return true for whitespace-only string", () => {
			expect(String.isWhitespace("   ")).toBe(true);
			expect(String.isWhitespace("\t\n")).toBe(true);
		});

		it("should return false for non-whitespace string", () => {
			expect(String.isWhitespace("abc")).toBe(false);
			expect(String.isWhitespace(" abc ")).toBe(false);
		});
	});

	describe("String.prototype.insteadEmpty", () => {
		it("should return fallback for empty string", () => {
			expect("".insteadEmpty("fallback")).toBe("fallback");
		});

		it("should return original string for non-empty", () => {
			expect("hello".insteadEmpty("fallback")).toBe("hello");
		});
	});

	describe("String.prototype.insteadWhitespace", () => {
		it("should return fallback for whitespace-only string", () => {
			expect("   ".insteadWhitespace("fallback")).toBe("fallback");
			expect("\n\t".insteadWhitespace("fallback")).toBe("fallback");
		});

		it("should return original string for non-whitespace", () => {
			expect("hello".insteadWhitespace("fallback")).toBe("hello");
			expect(" abc ".insteadWhitespace("fallback")).toBe(" abc ");
		});
	});

	describe("String.prototype.toTitleCase", () => {
		it("should capitalize first letter of each word", () => {
			expect("hello world".toTitleCase()).toBe("Hello World");
			expect("foo bar baz".toTitleCase()).toBe("Foo Bar Baz");
		});

		it("should handle mixed case and punctuation", () => {
			expect("hElLo, wOrLd!".toTitleCase()).toBe("Hello, World!");
			expect("a.b c".toTitleCase()).toBe("A.B C");
		});
	});

	describe("String.prototype.toLocalTitleCase", () => {
		it("should capitalize first letter of each word with locale", () => {
			expect("straße".toLocalTitleCase("de")).toBe("StraßE");
			expect("istanbul".toLocalTitleCase("tr")).toBe("İstanbul");
		});

		it("should handle array of locales", () => {
			expect("istanbul".toLocalTitleCase(["tr", "en"])).toBe("İstanbul");
		});
	});
});