import { Environment } from 'adaptive-extender/node';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Environment', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('static get env', () => {
		it('should return a new instance of Environment', () => {
			const instance1 = Environment.env;
			const instance2 = Environment.env;
			expect(instance1).toBeInstanceOf(Environment);
			expect(instance2).toBeInstanceOf(Environment);
			expect(instance1).not.toBe(instance2);
		});
	});

	describe('hasValue', () => {
		it('should return true if the key exists in process.env', () => {
			process.env.TEST_KEY = 'some value';
			const env = Environment.env;
			expect(env.hasValue('TEST_KEY')).toBe(true);
		});

		it('should return false if the key does not exist in process.env', () => {
			delete process.env.TEST_KEY;
			const env = Environment.env;
			expect(env.hasValue('NON_EXISTENT_KEY')).toBe(false);
		});
	});

	describe('readValue', () => {
		it('should return the string value if it is not valid JSON', () => {
			process.env.TEST_STRING = 'plain text';
			const env = Environment.env;
			expect(env.readValue('TEST_STRING')).toBe('plain text');
		});

		it('should parse and return the JSON value if it is valid JSON', () => {
			process.env.TEST_JSON = '{"foo": "bar", "num": 123}';
			const env = Environment.env;
			const result = env.readValue('TEST_JSON');
			expect(result).toEqual({ foo: 'bar', num: 123 });
		});

		it('should parse boolean strings correctly via JSON.parse', () => {
			process.env.TEST_BOOL = 'true';
			const env = Environment.env;
			expect(env.readValue('TEST_BOOL')).toBe(true);
		});

		it('should parse number strings correctly via JSON.parse', () => {
			process.env.TEST_NUM = '42';
			const env = Environment.env;
			expect(env.readValue('TEST_NUM')).toBe(42);
		});

		it('should throw a ReferenceError if the key is missing', () => {
			const env = Environment.env;
			expect(() => env.readValue('MISSING_KEY')).toThrow(ReferenceError);
			expect(() => env.readValue('MISSING_KEY')).toThrow("Key 'MISSING_KEY' at environment not registered");
		});
	});
});
