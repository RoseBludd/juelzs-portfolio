/**
 * Application logger with configurable levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Set log level based on environment
    // In development, only show warnings and errors by default
    // In production, only show errors
    this.level = process.env.NODE_ENV === 'production' 
      ? LogLevel.ERROR 
      : LogLevel.WARN;
    
    // Allow override via environment variable
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel) {
      switch (envLevel.toUpperCase()) {
        case 'ERROR':
          this.level = LogLevel.ERROR;
          break;
        case 'WARN':
          this.level = LogLevel.WARN;
          break;
        case 'INFO':
          this.level = LogLevel.INFO;
          break;
        case 'DEBUG':
          this.level = LogLevel.DEBUG;
          break;
      }
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  // Quiet methods that only log in development if explicitly enabled
  quietInfo(message: string, ...args: any[]): void {
    if (process.env.VERBOSE_LOGGING === 'true' && this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  quietDebug(message: string, ...args: any[]): void {
    if (process.env.VERBOSE_LOGGING === 'true' && this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }
}

export const logger = new Logger();
export default logger; 
