"use strict";

import "adaptive-extender/worker";
import { URI } from "adaptive-extender/worker";
import { describe, it, expect } from "vitest";

describe("URI (worker)", () => {
	it("should convert to a platform URL with punycode hosts", () => {
		const url = new URI("http://мир.рф/").toURL();
		expect(url).toBeInstanceOf(URL);
		expect(url.hostname).toBe("xn--h1ahn.xn--p1ai");
	});

	it("should round-trip a platform URL", () => {
		const url = new URL("https://a.dev/x?q=1#top");
		expect(URI.fromURL(url).href).toBe(url.href);
		expect(URI.fromURL(new URL("http://a/^x")).href).toBe("http://a/%5Ex");
	});
});
