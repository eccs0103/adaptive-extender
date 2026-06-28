import { Stopwatch, WebEngine } from "adaptive-extender/web";
import { describe, it, expect } from "vitest";

class TestEngine extends WebEngine {
	get fps() { return 0; }
	get delta() { return 0.5; }
}

describe("Stopwatch", () => {
	it("should start with elapsed 0 and launched false", () => {
		const engine = new TestEngine();
		const stopwatch = new Stopwatch(engine);
		expect(stopwatch.elapsed).toBe(0);
		expect(stopwatch.launched).toBe(false);
	});

	it("should not accumulate elapsed while not launched", () => {
		const engine = new TestEngine();
		const stopwatch = new Stopwatch(engine);
		engine.dispatchEvent(new Event("trigger"));
		engine.dispatchEvent(new Event("trigger"));
		expect(stopwatch.elapsed).toBe(0);
	});

	it("should accumulate elapsed when launched", () => {
		const engine = new TestEngine();
		const stopwatch = new Stopwatch(engine);
		stopwatch.launched = true;
		engine.dispatchEvent(new Event("trigger"));
		engine.dispatchEvent(new Event("trigger"));
		expect(stopwatch.elapsed).toBeCloseTo(1.0);
	});

	it("should reset elapsed to zero", () => {
		const engine = new TestEngine();
		const stopwatch = new Stopwatch(engine);
		stopwatch.launched = true;
		engine.dispatchEvent(new Event("trigger"));
		stopwatch.reset();
		expect(stopwatch.elapsed).toBe(0);
	});
});
