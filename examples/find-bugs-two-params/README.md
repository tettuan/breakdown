# Find Bugs Two Params Examples

This directory contains examples demonstrating the "find bugs two params" feature with various usage patterns.

## Basic Usage

### 1. Simple bug finding with equals format:
```bash
breakdown find bugs -f=buggy-javascript.js
```

### 2. With analysis depth:
```bash
breakdown find bugs -f=buggy-javascript.js --depth=deep
```

### 3. With custom output format:
```bash
breakdown find bugs -f=buggy-javascript.js --format=json
```

### 4. With severity assessment:
```bash
breakdown find bugs -f=buggy-javascript.js --severity=true
```

## Advanced Usage

### 1. Complete analysis with all options:
```bash
breakdown find bugs -f=buggy-javascript.js \
  --depth=deep \
  --format=markdown \
  --severity=true \
  --uv-project=MyApp \
  --uv-version=1.0.0
```

### 2. Using traditional format (without equals):
```bash
breakdown find bugs -f buggy-javascript.js --depth medium
```

### 3. With custom bug patterns:
```bash
breakdown find bugs -f=buggy-javascript.js \
  --patterns="null pointer,memory leak,race condition"
```

## Test Files

- `buggy-javascript.js` - JavaScript file with 10 common bug patterns
- `test-equals-format.sh` - Shell script to test equals format parsing
- `run-all-examples.sh` - Run all example scenarios

## Expected Output

The find bugs command should identify issues like:
- Null pointer dereferences
- Array bounds violations
- Division by zero
- Infinite loops
- Memory leaks
- Race conditions
- Type coercion issues
- Unhandled exceptions
- Resource leaks
- Security vulnerabilities