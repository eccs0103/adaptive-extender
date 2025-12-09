import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe('Reflect extensions', () => {
	describe('mapNull', () => {
		it('should return null if the value is null', () => {
			const result = Reflect.mapNull(null, (v) => v + 1);
			expect(result).toBeNull();
		});

		it('should apply the callback if the value is not null', () => {
			const result = Reflect.mapNull(5, (v) => v * 2);
			expect(result).toBe(10);
		});

		it('should treat undefined as a valid value and apply callback', () => {
			const result = Reflect.mapNull(undefined, (v) => 'was undefined');
			expect(result).toBe('was undefined');
		});
	});

	describe('mapUndefined', () => {
		it('should return undefined if the value is undefined', () => {
			const result = Reflect.mapUndefined(undefined, (v) => v + 1);
			expect(result).toBeUndefined();
		});

		it('should apply the callback if the value is not undefined', () => {
			const result = Reflect.mapUndefined(5, (v) => v * 2);
			expect(result).toBe(10);
		});

		it('should treat null as a valid value and apply callback', () => {
			const result = Reflect.mapUndefined(null, (v) => 'was null');
			expect(result).toBe('was null');
		});
	});

	describe('mapNullable', () => {
		it('should return null if the value is null', () => {
			const result = Reflect.mapNullable(null, (v) => v + 1);
			expect(result).toBeNull();
		});

		it('should return undefined if the value is undefined', () => {
			const result = Reflect.mapNullable(undefined, (v) => v + 1);
			expect(result).toBeUndefined();
		});

		it('should apply the callback if the value is neither null nor undefined', () => {
			const result = Reflect.mapNullable(5, (v) => v * 2);
			expect(result).toBe(10);
		});

		it('should work with objects', () => {
			const obj = { a: 1 };
			const result = Reflect.mapNullable(obj, (o) => o.a + 1);
			expect(result).toBe(2);
		});
	});
});
