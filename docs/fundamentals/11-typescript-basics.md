# TypeScript Basics

## Primitive Types in TypeScript and Programming

### What are primitive types?
Primitive types are the basic, simplest data types in programming. They store single values and are not objects.

### TypeScript/JavaScript Primitives

#### 1. string
Text data.
```typescript
let name: string = "John";
let greeting: string = 'Hello';
let template: string = `Hi ${name}`;  // Template literal
```

#### 2. number
Any numeric value (integer or decimal).
```typescript
let age: number = 25;
let price: number = 19.99;
let negative: number = -10;
```

Note: JavaScript/TypeScript has only one number type (no separate int/float).

#### 3. boolean
True or false value.
```typescript
let isActive: boolean = true;
let isComplete: boolean = false;
```

#### 4. null
Intentional absence of value.
```typescript
let data: null = null;  // "I explicitly set this to nothing"
```

#### 5. undefined
Variable exists but has no value assigned.
```typescript
let value: undefined = undefined;  // "No value assigned yet"
let user;  // automatically undefined
```

#### 6. symbol (ES6+)
Unique identifier (rarely used in daily coding).
```typescript
let id: symbol = Symbol('id');
let id2: symbol = Symbol('id');
// id !== id2  (always unique)
```

#### 7. bigint (ES2020+)
For very large integers beyond `number` limit.
```typescript
let huge: bigint = 9007199254740991n;
```

### Summary table

| Type | Example | Description |
|------|---------|-------------|
| `string` | `"hello"` | Text |
| `number` | `42`, `3.14` | Numbers (int or float) |
| `boolean` | `true`, `false` | True/false |
| `null` | `null` | Intentionally empty |
| `undefined` | `undefined` | Not assigned |
| `symbol` | `Symbol()` | Unique ID |
| `bigint` | `100n` | Very large numbers |

### Non-primitive types (Reference types)
These are NOT primitives:
- `object` - `{ name: "John" }`
- `array` - `[1, 2, 3]`
- `function` - `() => {}`
- `Date`, `Map`, `Set`, etc.

### Key difference: Primitives vs Objects

#### Primitives (value types)
```typescript
let a = 10;
let b = a;  // b gets a COPY of the value
b = 20;
console.log(a);  // 10 (unchanged)
```

#### Objects (reference types)
```typescript
let obj1 = { name: "John" };
let obj2 = obj1;  // obj2 gets a REFERENCE to the same object
obj2.name = "Jane";
console.log(obj1.name);  // "Jane" (changed!)
```

### Quick memory line
Primitives = basic single-value types (string, number, boolean, null, undefined).

---

## TypeScript Specific Features

### Type annotations
Tell TypeScript what type a variable should be.
```typescript
let age: number = 25;
let name: string = "John";
let isActive: boolean = true;
```

### Type inference
TypeScript guesses the type automatically.
```typescript
let age = 25;  // TypeScript knows it's number
let name = "John";  // TypeScript knows it's string
```

### Union types
Variable can be multiple types.
```typescript
let id: string | number;
id = "abc123";  // OK
id = 123;       // OK
```

### Type aliases
Create custom type names.
```typescript
type ID = string | number;
let userId: ID = "abc123";
```

### Literal types
Exact value types.
```typescript
let direction: "left" | "right" | "up" | "down";
direction = "left";   // OK
direction = "middle"; // ERROR
```

---

---

## `Record<K, V>` — typed object with known key and value shapes

### Why `Record` instead of `object`?

`object` in TypeScript is almost useless as a type — it just means "not a primitive." It tells you nothing about the shape.

```typescript
// ❌ Don't do this
let data: object = { name: 'Alice' };
data.name; // ERROR: Property 'name' does not exist on type 'object'
```

`Record<K, V>` is what you actually want when you have an object where:
- All **keys** are of the same type `K`
- All **values** are of the same type `V`

```typescript
// ✅ Use Record
let scores: Record<string, number> = {
  alice: 95,
  bob: 87,
  carol: 92
};

scores['alice'];        // TypeScript knows this is a number ✅
scores['alice'] = 100;  // OK ✅
scores['alice'] = 'A+'; // ERROR: string is not assignable to number ✅
```

### When to use `Record` vs other types

| Scenario | Use |
|----------|-----|
| Object with known keys and uniform value type | `Record<string, number>` |
| Object with a fixed set of keys | `Record<'read' \| 'write' \| 'delete', boolean>` |
| Map-like lookup table | `Record<string, User>` |
| Config objects | `Record<string, string>` |
| Object with mixed value shapes | Interface or type alias |

### Real-world examples

```typescript
// Permission map — every key must be a Role, every value a boolean
type Role = 'admin' | 'editor' | 'viewer';
const permissions: Record<Role, boolean> = {
  admin:  true,
  editor: true,
  viewer: false
  // TypeScript will error if you miss a key or add an unknown one
};

// Cache — string ID → User object
const userCache: Record<string, User> = {};
userCache['user-123'] = { id: 'user-123', name: 'Alice' };

// Translation map
const labels: Record<string, string> = {
  save:   'Save',
  cancel: 'Cancel',
  delete: 'Delete'
};
```

### `Record` with union key — exhaustive object

When the key is a union type, TypeScript forces you to provide **all** possible keys:

```typescript
type Status = 'pending' | 'active' | 'suspended';

const statusLabels: Record<Status, string> = {
  pending:   'Awaiting Review',
  active:    'Active',
  suspended: 'Account Suspended'
  // forgetting any key → compile error
};
```

This is far safer than a plain object — you can't accidentally miss a case.

### `object` vs `{}` vs `Record` vs interface

| Type | What it accepts | Use for |
|------|----------------|---------|
| `object` | Any non-primitive | Avoid — too vague |
| `{}` | Anything (even primitives!) | Avoid — almost useless |
| `Record<K, V>` | Object with uniform keys/values | Lookup tables, maps |
| `interface` / `type` | Object with specific named fields | Known shapes like User, Product |

---

## Common mistakes
- Confusing `null` and `undefined` (both mean "no value" but used differently)
- Thinking arrays and objects are primitives (they are reference types)
- Not understanding value vs reference types when copying variables
- Using `any` type (defeats purpose of TypeScript)
- Forgetting TypeScript types are removed at runtime (JavaScript doesn't have them)
- Using `object` as a type — it's almost useless, use `Record<K,V>` or an interface instead
