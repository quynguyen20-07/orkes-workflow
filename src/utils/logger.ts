// src/utils/logger.ts

export class Logger {
  private readonly context: string;

  constructor(context: string = "Application") {
    this.context = context;
  }

  private static readonly colors = {
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
    gray: "\x1b[90m",
  };

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, color: string, message: string): string {
    const time = `${Logger.colors.gray}${this.getTimestamp()}${Logger.colors.reset}`;
    const lvl = `${color}${level.padEnd(7)}${Logger.colors.reset}`;
    const ctx = `${Logger.colors.yellow}[${this.context}]${Logger.colors.reset}`;
    return `${time} ${lvl} ${ctx} ${message}`;
  }

  public log(message: string, ...optionalParams: any[]): void {
    console.log(
      this.formatMessage("LOG", Logger.colors.green, message),
      ...optionalParams,
    );
  }

  public error(
    message: string,
    trace?: string,
    ...optionalParams: any[]
  ): void {
    console.error(
      this.formatMessage("ERROR", Logger.colors.red, message),
      ...optionalParams,
    );
    if (trace) {
      console.error(`${Logger.colors.red}${trace}${Logger.colors.reset}`);
    }
  }

  public warn(message: string, ...optionalParams: any[]): void {
    console.warn(
      this.formatMessage("WARN", Logger.colors.yellow, message),
      ...optionalParams,
    );
  }

  public debug(message: string, ...optionalParams: any[]): void {
    console.debug(
      this.formatMessage("DEBUG", Logger.colors.magenta, message),
      ...optionalParams,
    );
  }

  public verbose(message: string, ...optionalParams: any[]): void {
    console.log(
      this.formatMessage("VERBOSE", Logger.colors.cyan, message),
      ...optionalParams,
    );
  }
}
