import { MetadataInjector } from "adaptive-extender/web";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("MetadataInjector — Organization", () => {
	beforeAll(() => {
		document.head.innerHTML = "";
		MetadataInjector.inject({
			type: "Organization",
			name: "Acme Corp",
			webpage: new URL("https://acme.com"),
			logo: new URL("https://acme.com/logo.png"),
			email: "info@acme.com",
			foundation: new Date("2000-01-15"),
		});
	});

	afterAll(() => {
		document.head.innerHTML = "";
	});

	it("should embed a ld+json script with Organization schema", () => {
		const script = document.querySelector('script[type="application/ld+json"]');
		expect(script).not.toBeNull();

		const data = JSON.parse(script!.textContent!);
		expect(data["@context"]).toBe("https://schema.org");
		expect(data["@type"]).toBe("Organization");
		expect(data.name).toBe("Acme Corp");
		expect(data.logo).toBe("https://acme.com/logo.png");
		expect(data.email).toBe("info@acme.com");
		expect(typeof data.foundingDate).toBe("string");
	});

	it("should set og:type to website", () => {
		expect(document.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe("website");
	});

	it("should not set author meta for Organization", () => {
		expect(document.querySelector('meta[name="author"]')).toBeNull();
	});
});
