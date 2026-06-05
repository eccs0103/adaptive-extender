import { MetadataInjector } from "adaptive-extender/web";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("MetadataInjector — Organization (minimal config)", () => {
	beforeAll(() => {
		document.head.innerHTML = "";
		MetadataInjector.inject({
			type: "Organization",
			name: "Minimal Org",
			webpage: new URL("https://minimal.org"),
		});
	});

	afterAll(() => {
		document.head.innerHTML = "";
	});

	it("should omit foundingDate from JSON when foundation is not provided", () => {
		const script = document.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script!.textContent!);
		expect(data.foundingDate).toBeUndefined();
	});

	it("should omit logo from JSON when logo is not provided", () => {
		const script = document.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script!.textContent!);
		expect(data.logo).toBeUndefined();
	});

	it("should omit image from JSON when preview is not provided", () => {
		const script = document.querySelector('script[type="application/ld+json"]');
		const data = JSON.parse(script!.textContent!);
		expect(data.image).toBeUndefined();
	});
});
