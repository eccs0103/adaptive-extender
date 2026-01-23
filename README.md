# Adaptive Extender

[![NPM Version](https://img.shields.io/npm/v/adaptive-extender.svg)](https://www.npmjs.com/package/adaptive-extender)

Adaptive library for JS/TS development environments.

**Adaptive Extender** is a comprehensive TypeScript library designed to bridge the gap between raw JavaScript primitives and high-level application logic. It augments native objects with fluent, intuitive APIs and provides robust systems for data modeling, time management, and asynchronous control flow.

[Change log](./CHANGELOG.md)

---

## ⚡ Key Features & Problems Solved

### 1. Type-Safe Data Portability (`Portable`)
**The Problem:**
Reading data from external sources (APIs, JSON files) usually results in `any` or untyped objects. Validating them requires verbose boilerplate repetitive mapping code. `JSON.parse` offers zero guarantees about shape or types.

**The Solution:**
The `Portable` system allows you to define strict schemas using decorators directly on your classes. It handles validation, type conversion, and polymorphic resolution automatically.

```typescript
import { Model, Field, ArrayOf, Nullable } from "adaptive-extender/core";

// Define a model
class User extends Model {
    @Field(String)
    name: string = "";

    @Field(Nullable(Number))
    age: number | null = null;
    
    @Field(ArrayOf(String))
    tags: string[] = [];
}

// ❌ The Problem: Unsafe JSON
const rawData = JSON.parse('{"name": "Alice", "tags": ["admin"]}');

// ✅ The Solution: Typed Import
// Validates structure and types automatically. Throws informative errors if invalid.
const user = User.import(rawData, "api_response"); 

console.log(user instanceof User); // true
console.log(user.name); // "Alice"
```

### 2. First-Class Time Management (`Timespan`)
**The Problem:**
Calculating durations using raw milliseconds (e.g., `86400000` for a day) is prone to "magic number" errors and is hard to read. Converting back and forth between days, minutes, and milliseconds creates messy math in your business logic.

**The Solution:**
The `Timespan` class offers a structured, readable way to handle time intervals, inspired by robust systems like .NET.

```typescript
import { Timespan } from "adaptive-extender/core";

// ❌ The Problem: Unreadable Math
// setTimeout(() => {}, 2 * 60 * 60 * 1000 + 30 * 1000); 

// ✅ The Solution: Explicit Definition
const duration = Timespan.fromComponents(0, 2, 30, 0); // 0 days, 2 hours, 30 min

console.log(duration.valueOf()); // 9000000 (milliseconds)
console.log(`Duration: ${duration.hours}h ${duration.minutes}m`);

// Parsing support
const fromString = Timespan.parse("02:30:00.000");
```

### 3. Extended Native Prototypes
**The Problem:**
JavaScript's standard library often lacks convenient utility methods found in other languages. Developers often write repetitive helper functions like `isEmpty(str)` or manual `for` loops to generate number ranges.

**The Solution:**
Adaptive Extender safely adds non-enumerable, standard-compliant extensions to native prototypes (`Array`, `String`, `Math`, etc.), making your code more expressive.

#### String Utilities
```typescript
// ❌ Original: Checks are verbose
if (str !== null && str !== undefined && str.trim() !== "") { ... }

// ✅ Extended: Clean & Readable
if (!String.isWhitespace(str)) { ... }

// Fallback values
const displayName = userInput.insteadWhitespace("files/default.png");
```

#### Array Utilities
```typescript
// ❌ Original: Manual loops for sequences
const nums = [];
for (let i = 0; i < 5; i++) nums.push(i);

// ✅ Extended: Python-like Range
const nums = Array.range(0, 5); // [0, 1, 2, 3, 4]

// Zipping arrays
const names = ["A", "B"];
const ages = [20, 30];
for (const [name, age] of Array.zip(names, ages)) {
    console.log(`${name} is ${age}`);
}
```

### 4. Advanced Promise Control
**The Problem:**
Managing complex asynchronous states or checking if a promise has settled without awaiting it can be difficult.

**The Solution:**
Extensions to `Promise` and the `Promisable<T>` type simplify async workflows.

```typescript
import { type Promisable } from "adaptive-extender/core";

// Unified type for Sync or Async values
function process(input: Promisable<string>) {
    // ...
}

// Check status (async check)
if (await mytask.isSettled) {
    console.log("Task finished");
}
```

---

## 📦 Modules

The library is split into scopes to keep your bundle size optimal:

- **`adaptive-extender/core`**:
  Platform-agnostic utilities (Math, Primitives, Time, Portable System). Works in Node.js, Deno, and Browser.
  
- **`adaptive-extender/node`**:
  Node.js specific extensions (Environment, File System processing).
  
- **`adaptive-extender/web`**:
  Browser specific DOM extensions (Element, ParentNode hooks).

---

## 🚀 Installation

```bash
npm install adaptive-extender
```

## 🛠 Usage

Simply import the module to activate the extensions.

```typescript
// Import core to register global proto extensions
import "adaptive-extender/core";

// Use features
const list = Array.range(1, 10);
```

## 📄 License

Apache-2.0
