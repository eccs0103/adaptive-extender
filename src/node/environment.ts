"use strict";

import "../core/index.js";
import "dotenv/config";

//#region Environment
/**
 * Represents the system environment and provides utility methods to access environment variables.
 */
export class Environment {
	/**
	 * Retrieves a new instance of the Environment class.
	 */
	static get env(): Environment {
		return new Environment();
	}

	/**
	 * Checks if a specific key exists within the environment variables.
	 */
	hasValue(key: string): boolean {
		const { env } = process;
		return (env[key] !== undefined);
	}

	/**
	 * Reads and parses the value of a specific environment variable.
	 * @throws {ReferenceError} if the key is missing.
	 */
	readValue(key: string): any {
		const { env } = process;
		const text = ReferenceError.suppress(env[key], `Key '${key}' at environment not registered`);
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}
}
//#endregion
