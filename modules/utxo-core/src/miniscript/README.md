# Miniscript WASM Shim

This shim provides a way to dynamically import the `@bitgo/wasm-miniscript` module and expose its exports (`ast`, `Descriptor`, `Miniscript`) in a synchronous manner after initialization.

## Usage

### 1. Initialize the shim (do this once at application startup)

```typescript
import { initializeMiniscript } from './shim';

// Initialize the WASM module at app startup
await initializeMiniscript();
```

### 2. Use the exports synchronously

```typescript
import { ast, Descriptor, Miniscript } from './shim';

// Now you can use these synchronously without await
const descriptor = new Descriptor('...');
const miniscript = new Miniscript('...');
const astNode = ast.parse('...');
```

### 3. Alternative: Use the shim class directly

```typescript
import { MiniscriptShim } from './shim';

const shim = MiniscriptShim.getInstance();
await shim.initialize();

// Check if initialized
if (shim.isInitialized) {
  const descriptor = new shim.Descriptor('...');
  const miniscript = new shim.Miniscript('...');
  const astNode = shim.ast.parse('...');
}
```

## Benefits

- **Lazy Loading**: The WASM module is only loaded when needed
- **Synchronous Access**: After initialization, consumers can use the exports without async/await
- **Caching**: The module is loaded once and cached for subsequent uses
- **Error Handling**: Clear error messages if used before initialization

## Important Notes

- You must call `initializeMiniscript()` or `shim.initialize()` before using the exports
- The initialization should be done once at application startup
- Using the exports before initialization will throw an error
