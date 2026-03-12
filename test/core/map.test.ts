import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Map extensions", () => {
	describe("Map.prototype.add", () => {
		it("should add a new entry and return true", () => {
			const map = new Map<string, number>();
			const result = map.add("key", 42);
			expect(result).toBe(true);
			expect(map.get("key")).toBe(42);
		});

		it("should not overwrite an existing entry and return false", () => {
			const map = new Map<string, number>([["key", 1]]);
			const result = map.add("key", 99);
			expect(result).toBe(false);
			expect(map.get("key")).toBe(1);
		});

		it("should add multiple distinct keys", () => {
			const map = new Map<string, number>();
			map.add("a", 1);
			map.add("b", 2);
			expect(map.size).toBe(2);
			expect(map.get("a")).toBe(1);
			expect(map.get("b")).toBe(2);
		});

		it("should return false for duplicate add on the same key", () => {
			const map = new Map<string, string>();
			map.add("x", "first");
			expect(map.add("x", "second")).toBe(false);
			expect(map.get("x")).toBe("first");
		});
	});
});
