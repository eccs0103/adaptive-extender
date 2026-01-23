# Adaptive Extender

[![NPM Version](https://img.shields.io/npm/v/adaptive-extender.svg)](https://www.npmjs.com/package/adaptive-extender)

Adaptive library for JS/TS development environments.

**Adaptive Extender** enables strict portability, structured time management, and LINQ-like collections by extending native prototypes. It provides a robust standard library layer for enterprise-grade architecture.

[Change log](./CHANGELOG.md)

---

## Core Systems

### 1. Strict Data Portability (`Portable`)
Integrates validation and serialization directly into domain models via decorators. The class definition serves as the authoritative schema, enabling automatic type checking and polymorphic resolution.

```typescript
import { Model, Field, ArrayOf } from "adaptive-extender/core";

class User extends Model {
    @Field(String) name: string = "Guest";
    @Field(ArrayOf(Number)) scores: number[] = [];
}

// 1. Validates types at runtime
// 2. Instantiates actual 'User' class
// 3. Throws informative errors on failure
const user = User.import(json, "api.user"); 
```

### 2. Value-Object Time (`Timespan`)
A dedicated structural type for time intervals. It encapsulates duration logic, preventing logic errors associated with raw millisecond arithmetic.

```typescript
import { Timespan } from "adaptive-extender/core";

// Readable, safe arithmetic
const cacheDuration = Timespan.fromComponents(0, 0, 5, 0); // 5 minutes
const uptime = Timespan.fromValue(process.uptime() * 1000);

// Use valueOf() for precise millisecond comparison
if (uptime.valueOf() > cacheDuration.valueOf()) {
    console.log("Cache expired"); 
}

// Structured formatting
console.log(uptime.toString()); // e.g. "0.00:12:45.123"
```

### 3. Native Prototype Extensions
Native prototypes (`Array`, `String`, `Math`) are augmented with missing standard utility methods. These extensions are non-enumerable and designed to be conflict-free.

```typescript
// Sequence generation
for (const i of Array.range(0, 5)) { ... } 

// Parallel iteration
for (const [user, role] of Array.zip(users, roles)) { ... }

// Safe Swap
items.swap(0, items.length - 1);
```

### 4. Structured Primitives (`Vector`, `Controller`)
Provides abstract base classes for mathematical vectors and unified controller logic for complex execution flows.

```typescript
import { Controller } from "adaptive-extender/core";

// Cancellable, error-handling async worker
class ImportTask extends Controller {
    async run() { ... }
    async catch(err) { ... }
}
```

---

## Native Extensions

A collection of high-performance utilities that eliminate common boilerplate.

| Feature | Native JavaScript | Adaptive Extender |
| :--- | :--- | :--- |
| **Math Clamping** | `Math.min(Math.max(val, 0), 100)` | `val.clamp(0, 100)` |
| **Math Remap** | `(val - a) * (d - c) / (b - a) + c` | `val.lerp(a, b, c, d)` |
| **Modulo** | `((val % n) + n) % n` | `val.mod(n)` |
| **Random** | `Math.floor(Math.random()...` | `Random.global.number(min, max)` |
| **String Empty** | `!str \|\| str.trim().length === 0` | `String.isWhitespace(str)` |
| **String Defaults** | `str \|\| "default"` | `str.insteadEmpty("default")` |
| **Async List** | *Manual loop with `Promise.all`* | `await Array.fromAsync(stream)` |
| **Promise State** | *n/a* | `await task.isSettled` |

---

## Architecture

- **`adaptive-extender/core`**: 
  Universal utilities. Works in Browser, Node, Deno.
  *(Math, arrays, promises, portable system, time)*

- **`adaptive-extender/node`**: 
  Backend-specific tools.
  *(Enhanced `fs` operations, strict environment variable parsing)*

- **`adaptive-extender/web`**: 
  Frontend-specific tools.
  *(DOM element wrappers, parent-node extensions)*

## Installation

```bash
npm install adaptive-extender
```

## Usage

```typescript
import "adaptive-extender/core";

// Extensions are now active
if (String.isEmpty(config.name)) {
  // ...
}
```

## License

Apache-2.0
