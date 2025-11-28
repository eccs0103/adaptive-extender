"use strict";

import "../core/index.js";
import "dotenv/config";

//#region Environment
class Environment {
	static get env(): Environment {
		return new Environment();
	}

	hasValue(key: string): boolean {
		const { env } = process;
		return (env[key] !== undefined);
	}

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

export { Environment };
