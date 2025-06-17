## API Reference

### BreakdownLogger

The main logger class that provides structured logging with environment-based
filtering.

#### Constructor

```typescript
new BreakdownLogger(key?: string)
```

- `key` (optional): Unique identifier for this logger instance. Used for
  filtering with LOG_KEY. Defaults to "default" if not provided.

#### Methods

- `debug(message: string, data?: unknown): void` - Log debug information
- `info(message: string, data?: unknown): void` - Log general information
- `warn(message: string, data?: unknown): void` - Log warnings
- `error(message: string, data?: unknown): void` - Log errors

### LogLevel

Enum for log levels:

```typescript
enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}
```

### Output Format

```
[timestamp] [LEVEL] [key] message
Data: { optional data object }
```

Example:

```
[2024-03-10T12:00:00.000Z] [DEBUG] [auth] User login attempt
Data: { userId: 12345, ip: "192.168.1.100" }
```
