import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { OrkesService } from "../services/orkes.service";

const orkesService = new OrkesService();
const WEBHOOK_LOG_FILE = path.join(process.cwd(), "webhook_notifications.json");

// Helper đọc danh sách Webhook từ file JSON
const getWebhookLogs = () => {
  try {
    if (fs.existsSync(WEBHOOK_LOG_FILE)) {
      const data = fs.readFileSync(WEBHOOK_LOG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Lỗi đọc file webhook_notifications.json:", e);
  }
  return [];
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const wfName = "Performance_Review_Mock_Workflow";
    let wfId = req.query.workflowId as string;
    const message = (req.query.message as string) || "";

    const workflowDef: any = await orkesService.getWorkflowDef(wfName);
    let workflowExe: any = null;
    let pendingTask: any = null;
    let completedTasks: any[] = [];

    // Tự động lấy luồng đang chạy nếu không có workflowId trên URL
    if (!wfId) {
      const runningWfs = await orkesService.getRunningWorkflows(wfName);
      if (runningWfs && runningWfs.length > 0) {
        wfId = runningWfs[0];
      }
    }

    if (wfId) {
      workflowExe = await orkesService.getWorkflowDetails(wfId);

      // 🌟 THUẬT TOÁN BẮT TASK CHỜ DUYỆT BẢO ĐẢM 100%
      pendingTask = workflowExe.tasks?.find((t: any) => {
        const isPending =
          t.status === "IN_PROGRESS" || t.status === "SCHEDULED";
        // Lấy type từ workflowTask hoặc taskType
        const rawType = (
          t.workflowTask?.type ||
          t.taskType ||
          t.type ||
          ""
        ).toUpperCase();

        // Task cần thao tác tay là Task SIMPLE hoặc không phải hệ thống (HTTP, FORK_JOIN, JOIN)
        const isHumanTask =
          rawType === "SIMPLE" ||
          !["HTTP", "FORK_JOIN", "JOIN", "WAIT"].includes(rawType);

        return isPending && isHumanTask;
      });

      // Lọc các task đã completed
      completedTasks =
        workflowExe.tasks?.filter(
          (t: any) =>
            t.status === "COMPLETED" && t.outputData && t.outputData.comments,
        ) || [];
    }

    const webhookLogs = getWebhookLogs();

    res.render("dashboard", {
      workflowDef,
      workflowExe,
      pendingTask,
      completedTasks,
      webhookLogs,
      message,
      wfId,
    });
  } catch (error: any) {
    res.status(500).send(`Lỗi hệ thống: ${error.message}`);
  }
};

export const startWorkflow = async (req: Request, res: Response) => {
  try {
    const wfName = "Performance_Review_Mock_Workflow";
    const runningWfs = await orkesService.getRunningWorkflows(wfName);

    // Hủy các luồng cũ đang chạy dở trước khi tạo luồng mới
    if (runningWfs && runningWfs.length > 0) {
      for (const oldWfId of runningWfs) {
        await orkesService.terminateWorkflow(oldWfId, "Khởi tạo luồng mới");
      }
    }

    const host = req.get("host");
    const serverBaseUrl = process.env.PUBLIC_URL || `${req.protocol}://${host}`;
    const webhookUrl = `${serverBaseUrl}/api/webhook/notify`;

    const newWfId = await orkesService.startWorkflow(webhookUrl);
    res.redirect(
      `/?workflowId=${newWfId}&message=Khởi tạo luồng mới thành công!`,
    );
  } catch (error: any) {
    res.redirect(`/?message=Lỗi Start: ${error.message}`);
  }
};

export const completeTask = async (req: Request, res: Response) => {
  const { taskId, workflowInstanceId, decision, comments } = req.body;
  try {
    await orkesService.completeTask(taskId, workflowInstanceId, {
      decision,
      comments,
      processedBy: "Admin Portal",
      completedAt: new Date().toISOString(),
    });
    res.redirect(
      `/?workflowId=${workflowInstanceId}&message=Đã duyệt Task thành công!`,
    );
  } catch (error: any) {
    res.redirect(
      `/?workflowId=${workflowInstanceId}&message=Lỗi: ${error.message}`,
    );
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    let bodyData = req.body;
    if (typeof bodyData === "string") {
      try {
        bodyData = JSON.parse(bodyData);
      } catch (e) {
        bodyData = { raw: req.body };
      }
    }

    const { workflowId } = bodyData || {};
    let orkesOutput = null;

    if (workflowId) {
      try {
        const details: any = await orkesService.getWorkflowDetails(workflowId);
        orkesOutput = {
          workflowId: details.workflowId,
          status: details.status,
          workflowOutput: details.output || {},
          executedTasks: details.tasks?.map((t: any) => ({
            refName: t.referenceTaskName,
            status: t.status,
            outputData: t.outputData,
          })),
        };
      } catch (e: any) {
        console.warn(
          `⚠️ Không thể lấy workflow details cho ID ${workflowId}:`,
          e.message,
        );
      }
    }

    const logs = getWebhookLogs();
    const newLog = {
      id: Date.now().toString(),
      receivedAt: new Date().toISOString(),
      payload: bodyData || {},
      orkesExecution: orkesOutput,
    };

    logs.unshift(newLog);

    fs.writeFileSync(
      WEBHOOK_LOG_FILE,
      JSON.stringify(logs.slice(0, 30), null, 2),
      "utf-8",
    );

    console.log(
      "🔔 [Webhook] Đã nhận thông báo & enriched dữ liệu từ Orkes Server!",
    );
  } catch (err) {
    console.error("Lỗi khi ghi file Webhook JSON:", err);
  }

  res.status(200).json({ success: true });
};
