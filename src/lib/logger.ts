type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

export class Logger {
  constructor(private readonly defaultContext: LogContext = {}) {}

  child(context: LogContext): Logger {
    return new Logger({ ...this.defaultContext, ...context });
  }

  info(message: string, context: LogContext = {}): void {
    this.write("info", message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.write("warn", message, context);
  }

  error(message: string, context: LogContext = {}): void {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.defaultContext,
      ...context,
    };

    // Keep logs structured for downstream aggregation.
    console.log(JSON.stringify(entry));
  }
}

export const logger = new Logger();
