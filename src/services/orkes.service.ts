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
      // API này trả về một mảng chứa các Workflow ID đang ở trạng thái RUNNING
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

  // 2. Hủy một luồng đang chạy
  async terminateWorkflow(
    workflowId: string,
    reason: string = "Bị hủy bởi luồng mới",
  ) {
    const client = await this.clientPromise;
    // Gọi API terminate để ép kết thúc luồng
    return client.workflowResource.terminate(workflowId, reason);
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

    // Cập nhật task thông qua đối tượng request chuẩn
    return client.taskResource.updateTask1({
      taskId: taskId,
      workflowInstanceId: workflowInstanceId,
      status: "COMPLETED",
      outputData: outputData,
    });
  }

  async getWorkflowDetails(workflowId: string) {
    const client = await this.clientPromise;
    // Tham số 'true' để lấy luôn danh sách chi tiết các tasks bên trong
    return client.workflowResource.getExecutionStatus(workflowId, true);
  }

  async getWorkflowDef(name: string, version: number = 1) {
    const client = await this.clientPromise;
    // API kéo bản vẽ gốc từ server
    return client.metadataResource.get(name, version);
  }
}
