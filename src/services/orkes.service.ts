// src/services/orkes.service.ts

import {
  orkesConductorClient,
  StartWorkflowRequest,
  Workflow,
} from "@io-orkes/conductor-javascript";
import dotenv from "dotenv";
import { Logger } from "../utils/logger";

dotenv.config();

export class OrkesService {
  private readonly logger = new Logger("OrkesService");
  private readonly clientPromise: Promise<any>;
  private readonly workflowName: string;

  constructor() {
    const serverUrl =
      process.env.ORKES_SERVER_URL || "https://play.orkes.io/api";
    const keyId = process.env.ORKES_KEY_ID || "";
    const keySecret = process.env.ORKES_KEY_SECRET || "";
    const wfName = process.env.ORKES_WORKFLOW_NAME;

    if (!wfName) {
      this.logger.error(
        "ORKES_WORKFLOW_NAME is not defined in environment variables!",
      );
      throw new Error(
        "Missing ORKES_WORKFLOW_NAME in environment configuration.",
      );
    }

    this.workflowName = wfName;
    this.logger.log(
      `Initializing Orkes Conductor Client -> Server: ${serverUrl}`,
    );

    this.clientPromise = orkesConductorClient({
      serverUrl,
      keyId,
      keySecret,
    }).catch((err) => {
      this.logger.error(
        "Failed to connect to Orkes Conductor Server",
        err.stack,
      );
      throw err;
    });
  }

  public getWorkflowName(): string {
    return this.workflowName;
  }

  public async startWorkflow(
    webhookUrl: string,
    humanTaskWebhookUrl?: string,
  ): Promise<string> {
    try {
      const client = await this.clientPromise;
      const startReq: StartWorkflowRequest = {
        name: this.workflowName,
        version: 1,
        input: {
          webhook_url: webhookUrl,
          human_task_webhook_url: humanTaskWebhookUrl || webhookUrl,
        },
      };

      this.logger.log(`Starting Workflow Execution: ${this.workflowName}`);
      const workflowId = await client.workflowResource.startWorkflow(startReq);
      this.logger.log(
        `Workflow started successfully -> Instance ID: ${workflowId}`,
      );
      return workflowId;
    } catch (error: any) {
      this.logger.error(
        `Error starting workflow [${this.workflowName}]`,
        error.stack,
      );
      throw error;
    }
  }

  public async getRunningWorkflows(version: number = 1): Promise<string[]> {
    try {
      const client = await this.clientPromise;
      const runningIds = await client.workflowResource.getRunningWorkflow(
        this.workflowName,
        version,
      );
      return runningIds || [];
    } catch (error: any) {
      this.logger.warn(
        `Failed to retrieve running workflows for [${this.workflowName}]`,
        error.message,
      );
      return [];
    }
  }

  public async terminateWorkflow(
    workflowId: string,
    reason: string = "Terminated by System",
  ): Promise<void> {
    try {
      const client = await this.clientPromise;
      const wfResource = client.workflowResource;

      this.logger.warn(
        `Terminating Workflow ID: ${workflowId} | Reason: ${reason}`,
      );

      if (typeof wfResource.terminate1 === "function") {
        await wfResource.terminate1(workflowId, reason);
      } else if (typeof wfResource.terminate === "function") {
        await wfResource.terminate(workflowId, reason);
      }
    } catch (error: any) {
      this.logger.warn(
        `Unable to terminate workflow ${workflowId}`,
        error.message,
      );
    }
  }

  public async completeTask(
    taskId: string,
    workflowInstanceId: string,
    outputData: Record<string, any>,
  ): Promise<void> {
    try {
      const client = await this.clientPromise;
      this.logger.log(
        `Completing Task ID: ${taskId} for Workflow ID: ${workflowInstanceId}`,
      );

      await client.taskResource.updateTask1({
        taskId,
        workflowInstanceId,
        status: "COMPLETED",
        outputData,
      });

      this.logger.log(`Task ${taskId} completed successfully.`);
    } catch (error: any) {
      this.logger.error(`Failed to complete task ${taskId}`, error.stack);
      throw error;
    }
  }

  public async getWorkflowDetails(workflowId: string): Promise<Workflow> {
    try {
      const client = await this.clientPromise;
      return await client.workflowResource.getExecutionStatus(workflowId, true);
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch workflow execution details for ID: ${workflowId}`,
        error.stack,
      );
      throw error;
    }
  }

  public async getWorkflowDef(version: number = 1): Promise<any> {
    try {
      const client = await this.clientPromise;
      return await client.metadataResource.get(this.workflowName, version);
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch workflow definition for: ${this.workflowName}`,
        error.stack,
      );
      throw error;
    }
  }
}
