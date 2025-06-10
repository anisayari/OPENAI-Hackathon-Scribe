import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  endpoint: string;
  request: any;
  response: any;
  error?: any;
}

export class APILogger {
  private logDir: string;

  constructor(logDir: string = 'logs') {
    this.logDir = path.join(process.cwd(), logDir);
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private generateFileName(endpoint: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timestamp = date.getTime();
    const sanitizedEndpoint = endpoint.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${dateStr}_${sanitizedEndpoint}_${timestamp}.json`;
  }

  log(endpoint: string, request: any, response: any, error?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      request,
      response,
      error
    };

    const fileName = this.generateFileName(endpoint);
    const filePath = path.join(this.logDir, fileName);

    try {
      fs.writeFileSync(filePath, JSON.stringify(logEntry, null, 2));
      console.log(`Log saved: ${fileName}`);
    } catch (err) {
      console.error('Error saving log:', err);
    }
  }

  async logAsync(endpoint: string, request: any, response: any, error?: any): Promise<void> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      request,
      response,
      error
    };

    const fileName = this.generateFileName(endpoint);
    const filePath = path.join(this.logDir, fileName);

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(logEntry, null, 2));
      console.log(`Log saved: ${fileName}`);
    } catch (err) {
      console.error('Error saving log:', err);
    }
  }
}

// Create a singleton instance
export const apiLogger = new APILogger();