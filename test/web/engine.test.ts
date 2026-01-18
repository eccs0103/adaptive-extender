import { FastEngine, PreciseEngine, StaticEngine, WebEngine } from "adaptive-extender/web";
import { describe, it, expect, vi } from "vitest";

describe("WebEngine", () => {
	it("should not allow direct instantiation", () => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect(() => new WebEngine()).toThrow(TypeError);
	});

	it("should set and get launched property", () => {
		class TestEngine extends WebEngine {
			get fps() { return 0; }
			get delta() { return 0; }
		}
		const engine = new TestEngine();
		expect(engine.launched).toBe(false);
		engine.launched = true;
		expect(engine.launched).toBe(true);
	});

	it("should dispatch 'change' event when launched changes", () => {
		class TestEngine extends WebEngine {
			get fps() { return 0; }
			get delta() { return 0; }
		}
		const engine = new TestEngine();
		const spy = vi.fn();
		engine.addEventListener("change", spy);

		engine.launched = true;
		expect(spy).toHaveBeenCalledOnce();

		engine.launched = true;
		expect(spy).toHaveBeenCalledOnce();
	});

	it("should set and get limit property", () => {
		class TestEngine extends WebEngine {
			get fps() { return 0; }
			get delta() { return 0; }
		}
		const engine = new TestEngine();
		engine.limit = 60;
		expect(engine.limit).toBeCloseTo(60);

		engine.limit = NaN;
		expect(engine.limit).toBeCloseTo(60);
		engine.limit = -1;
		expect(engine.limit).toBeCloseTo(60);
	});
});

describe("FastEngine", () => {
	it("should initialize and have fps/delta properties", () => {
		const engine = new FastEngine();
		expect(typeof engine.fps).toBe("number");
		expect(typeof engine.delta).toBe("number");
	});

	it("should allow setting launched and limit", () => {
		const engine = new FastEngine({ launch: true });
		engine.limit = 30;
		expect(engine.limit).toBeCloseTo(30);
		engine.launched = false;
		expect(engine.launched).toBe(false);
	});
});

describe("PreciseEngine", () => {
	it("should initialize and have fps/delta properties", () => {
		const engine = new PreciseEngine();
		expect(typeof engine.fps).toBe("number");
		expect(typeof engine.delta).toBe("number");
	});

	it("should allow setting launched and limit", () => {
		const engine = new PreciseEngine({ launch: true });
		engine.limit = 30;
		expect(engine.limit).toBeCloseTo(30);
		engine.launched = false;
		expect(engine.launched).toBe(false);
	});
});

describe("StaticEngine", () => {
	it("should initialize and have fps/delta properties", () => {
		const engine = new StaticEngine();
		expect(typeof engine.fps).toBe("number");
		expect(typeof engine.delta).toBe("number");
	});

	it("should allow setting launched and limit", () => {
		const engine = new StaticEngine({ launch: true });
		engine.limit = 30;
		expect(engine.limit).toBeCloseTo(30);
		engine.launched = false;
		expect(engine.launched).toBe(false);
	});
});
