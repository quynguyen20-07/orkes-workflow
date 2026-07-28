import {
  orkesConductorClient,
  StartWorkflowRequest,
} from "@io-orkes/conductor-javascript";
import dotenv from "dotenv";
dotenv.config();

export class OrkesService {
  private clientPromise: Promise<any>;

  constructor() {
    this.clientPromise = orkesConductorClient({
      serverUrl: process.env.ORKES_SERVER_URL || "https://play.orkes.io/api",
      keyId: process.env.ORKES_KEY_ID || "",
      keySecret: process.env.ORKES_KEY_SECRET || "",
    });
  }

  async startWorkflow(webhookUrl: string) {
    const client = await this.clientPromise;

    const startReq: StartWorkflowRequest = {
      name: "Performance_Review_Mock_Workflow",
      version: 1,
      input: {
        webhook_url: webhookUrl,
      },
    };

    return client.workflowResource.startWorkflow(startReq);
  }

  async getRunningWorkflows(workflowName: string, version: number = 1) {
    const client = await this.clientPromise;
    try {
      const runningIds = await client.workflowResource.getRunningWorkflow(
        workflowName,
        version,
      );
      return runningIds || [];
    } catch (error) {
      console.error("Lỗi khi tìm luồng đang chạy:", error);
      return [];
    }
  }

  async terminateWorkflow(
    workflowId: string,
    reason: string = "Bị hủy bởi luồng mới",
  ) {
    const client = await this.clientPromise;
    const wfResource = client.workflowResource;

    try {
      if (typeof wfResource.terminate1 === "function") {
        return await wfResource.terminate1(workflowId, reason);
      } else if (typeof wfResource.terminate === "function") {
        return await wfResource.terminate(workflowId, reason);
      }
    } catch (error) {
      console.warn(`Không thể terminate workflow ${workflowId}:`, error);
    }
  }

  async getNextPendingTask() {
    const client = await this.clientPromise;
    const task = await client.taskResource.poll(
      "mock_human_task",
      "mvc-portal-app",
    );
    return task || null;
  }

  async completeTask(
    taskId: string,
    workflowInstanceId: string,
    outputData: any,
  ) {
    const client = await this.clientPromise;

    return client.taskResource.updateTask1({
      taskId: taskId,
      workflowInstanceId: workflowInstanceId,
      status: "COMPLETED",
      outputData: outputData,
    });
  }

  async getWorkflowDetails(workflowId: string) {
    const client = await this.clientPromise;
    return client.workflowResource.getExecutionStatus(workflowId, true);
  }

  async getWorkflowDef(name: string, version: number = 1) {
    const client = await this.clientPromise;
    return client.metadataResource.get(name, version);
  }
}
