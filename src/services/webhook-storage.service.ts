// src/services/webhook-storage.service.ts

import fs from "fs";
import path from "path";
import { Logger } from "../utils/logger";

export interface WebhookLogEntry {
  id: string;
  eventType: "SYSTEM_NOTIFY" | "HUMAN_TASK_NOTIFY";
  receivedAt: string;
  payload: Record<string, any>;
  orkesExecution?: Record<string, any> | null;
}

export class WebhookStorageService {
  private readonly logger = new Logger("WebhookStorageService");
  private readonly filePath: string;
  private readonly maxLogs: number;

  constructor(filePath?: string, maxLogs: number = 30) {
    this.filePath =
      filePath || path.join(process.cwd(), "webhook_notifications.json");
    this.maxLogs = maxLogs;
  }

  public getLogs(): WebhookLogEntry[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const rawData = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(rawData) as WebhookLogEntry[];
    } catch (error: any) {
      this.logger.error(
        "Failed to read webhook logs from storage file",
        error.stack,
      );
      return [];
    }
  }

  public appendLog(
    entry: Omit<WebhookLogEntry, "id" | "receivedAt">,
  ): WebhookLogEntry {
    try {
      const logs = this.getLogs();
      const newEntry: WebhookLogEntry = {
        id: Date.now().toString(),
        receivedAt: new Date().toISOString(),
        ...entry,
      };

      logs.unshift(newEntry);
      const cappedLogs = logs.slice(0, this.maxLogs);

      fs.writeFileSync(
        this.filePath,
        JSON.stringify(cappedLogs, null, 2),
        "utf-8",
      );
      this.logger.log(
        `Appended new webhook entry [${newEntry.eventType}] successfully.`,
      );
      return newEntry;
    } catch (error: any) {
      this.logger.error(
        "Failed to write webhook log to storage file",
        error.stack,
      );
      throw error;
    }
  }
}
