"use strict";

import "adaptive-extender/core";
import { URISearchParams } from "adaptive-extender/core";
import { describe, it, expect, vi } from "vitest";

describe("URISearchParams", () => {
	describe("constructor", () => {
		it("should parse a query string and ignore a leading '?'", () => {
			const parameters = new URISearchParams("?a=1&&b=&c&d=x=y");
			expect([...parameters]).toEqual([["a", "1"], ["b", ""], ["c", ""], ["d", "x=y"]]);
		});

		it("should decode '+' as a space but keep '%2B' as a plus", () => {
			const parameters = new URISearchParams("q=a+b%2Bc");
			expect(parameters.get("q")).toBe("a b+c");
		});

		it("should decode UTF-8 and replace invalid sequences with U+FFFD", () => {
			expect(new URISearchParams("x=%E2%82%AC").get("x")).toBe("€");
			expect(new URISearchParams("x=%E2%82").get("x")).toBe("�");
			expect(new URISearchParams("x=%FF%41").get("x")).toBe("�A");
			expect(new URISearchParams("x=%zz").get("x")).toBe("%zz");
		});

		it("should create from pairs and records", () => {
			expect(new URISearchParams([["a", "1"], ["a", "2"]]).getAll("a")).toEqual(["1", "2"]);
			expect(new URISearchParams({ a: "1", b: "2" }).toString()).toBe("a=1&b=2");
			expect(new URISearchParams(new URISearchParams("k=v")).get("k")).toBe("v");
		});

		it("should throw TypeError for a pair of the wrong length", () => {
			expect(() => new URISearchParams(JSON.parse(`[["a", "1"], ["b"]]`))).toThrow(TypeError);
		});
	});

	describe("methods", () => {
		it("should get, has and getAll", () => {
			const parameters = new URISearchParams("a=1&b=2&a=3");
			expect(parameters.get("a")).toBe("1");
			expect(parameters.get("z")).toBeNull();
			expect(parameters.has("b")).toBe(true);
			expect(parameters.has("a", "3")).toBe(true);
			expect(parameters.has("a", "4")).toBe(false);
			expect(parameters.getAll("a")).toEqual(["1", "3"]);
			expect(parameters.size).toBe(3);
		});

		it("should delete by name or by name and value", () => {
			const parameters = new URISearchParams("a=1&b=2&a=3");
			parameters.delete("a", "3");
			expect(parameters.toString()).toBe("a=1&b=2");
			parameters.delete("a");
			expect(parameters.toString()).toBe("b=2");
		});

		it("should set the first value and drop the rest", () => {
			const parameters = new URISearchParams("a=1&b=2&a=3");
			parameters.set("a", "9");
			expect(parameters.toString()).toBe("a=9&b=2");
			parameters.set("c", "4");
			expect(parameters.toString()).toBe("a=9&b=2&c=4");
		});

		it("should sort stably by name", () => {
			const parameters = new URISearchParams("z=1&a=2&z=0&a=1");
			parameters.sort();
			expect(parameters.toString()).toBe("a=2&a=1&z=1&z=0");
		});

		it("should iterate keys, values and forEach in order", () => {
			const parameters = new URISearchParams("a=1&b=2");
			expect([...parameters.keys()]).toEqual(["a", "b"]);
			expect([...parameters.values()]).toEqual(["1", "2"]);
			const callback = vi.fn();
			parameters.forEach(callback);
			expect(callback).toHaveBeenNthCalledWith(1, "1", "a", parameters);
			expect(callback).toHaveBeenNthCalledWith(2, "2", "b", parameters);
		});

		it("should serialize like application/x-www-form-urlencoded", () => {
			const parameters = new URISearchParams();
			parameters.append("a b", "c&d=e");
			parameters.append("sym", "!'()~*-._");
			parameters.append("lone", "\uD800");
			expect(parameters.toString()).toBe("a+b=c%26d%3De&sym=%21%27%28%29%7E*-._&lone=%EF%BF%BD");
		});
	});
});
