// src/controllers/workflow.controller.ts

import { Request, Response } from "express";
import { OrkesService } from "../services/orkes.service";
import { WebhookStorageService } from "../services/webhook-storage.service";
import { Logger } from "../utils/logger";

const logger = new Logger("WorkflowController");
const orkesService = new OrkesService();
const webhookStorageService = new WebhookStorageService();

/**
 * Helper tìm kiếm Workflow ID đệ quy trong Webhook Payload
 */
const extractWorkflowIdRecursive = (obj: any): string | null => {
  if (!obj || typeof obj !== "object") return null;

  const targetKeys = [
    "workflowid",
    "workflow_id",
    "wfid",
    "wf_id",
    "workflowinstanceid",
    "instanceid",
  ];

  for (const key of Object.keys(obj)) {
    if (targetKeys.includes(key.toLowerCase())) {
      const val = obj[key];
      if (typeof val === "string" && val.trim().length > 10) {
        return val.trim();
      }
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = extractWorkflowIdRecursive(obj[key]);
      if (found) return found;
    }
  }

  return null;
};

/**
 * Xử lý chung việc bóc tách và lưu vết Webhook Audit Trail
 */
const processAndLogWebhook = async (
  req: Request,
  eventType: "SYSTEM_NOTIFY" | "HUMAN_TASK_NOTIFY",
): Promise<void> => {
  let bodyData: any = req.body;

  if (typeof bodyData === "string") {
    try {
      bodyData = JSON.parse(bodyData);
    } catch {
      bodyData = { rawText: req.body };
    }
  }

  if (
    !bodyData ||
    (typeof bodyData === "object" && Object.keys(bodyData).length === 0)
  ) {
    if (req.query && Object.keys(req.query).length > 0) {
      bodyData = req.query;
    }
  }

  const workflowId =
    extractWorkflowIdRecursive(bodyData) ||
    extractWorkflowIdRecursive(req.query);
  let orkesExecution: Record<string, any> | null = null;

  if (workflowId) {
    try {
      const details: any = await orkesService.getWorkflowDetails(workflowId);
      orkesExecution = {
        workflowId: details.workflowId,
        status: details.status,
        workflowOutput: details.output || {},
        executedTasks: details.tasks?.map((t: any) => ({
          refName: t.referenceTaskName,
          status: t.status,
          outputData: t.outputData,
        })),
      };
    } catch (err: any) {
      logger.warn(
        `Could not enrich Webhook Payload with Orkes details for ID ${workflowId}: ${err.message}`,
      );
    }
  }

  webhookStorageService.appendLog({
    eventType,
    payload: bodyData || {},
    orkesExecution,
  });

  logger.log(
    `Webhook Event [${eventType}] processed. Workflow ID: ${workflowId || "N/A"}`,
  );
};

/**
 * GET / - Render Dashboard
 */
export const getDashboard = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    let wfId = req.query.workflowId as string;
    const message = (req.query.message as string) || "";

    const workflowDef = await orkesService.getWorkflowDef();
    let workflowExe: any = null;
    let pendingTask: any = null;
    let completedTasks: any[] = [];

    if (!wfId) {
      const runningWfs = await orkesService.getRunningWorkflows();
      if (runningWfs.length > 0) {
        wfId = runningWfs[0];
      }
    }

    if (wfId) {
      workflowExe = await orkesService.getWorkflowDetails(wfId);

      pendingTask = workflowExe.tasks?.find((t: any) => {
        const isPending =
          t.status === "IN_PROGRESS" || t.status === "SCHEDULED";
        const rawType = (
          t.workflowTask?.type ||
          t.taskType ||
          t.type ||
          ""
        ).toUpperCase();
        const isHumanTask =
          rawType === "SIMPLE" ||
          rawType === "HUMAN" ||
          !["HTTP", "FORK_JOIN", "JOIN", "WAIT"].includes(rawType);
        return isPending && isHumanTask;
      });

      completedTasks =
        workflowExe.tasks?.filter(
          (t: any) =>
            t.status === "COMPLETED" && t.outputData && t.outputData.comments,
        ) || [];
    }

    const webhookLogs = webhookStorageService.getLogs();

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
    logger.error("Error rendering Dashboard", error.stack);
    res.status(500).send(`Lỗi hệ thống: ${error.message}`);
  }
};

/**
 * POST /workflow/start - Trigger Workflow Mới
 */
export const startWorkflow = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const runningWfs = await orkesService.getRunningWorkflows();

    if (runningWfs.length > 0) {
      for (const oldWfId of runningWfs) {
        await orkesService.terminateWorkflow(
          oldWfId,
          "Khởi tạo luồng mới từ Dashboard",
        );
      }
    }

    const host = req.get("host");
    const serverBaseUrl = process.env.PUBLIC_URL || `${req.protocol}://${host}`;
    const webhookUrl = `${serverBaseUrl}/api/webhook/notify`;
    const humanTaskWebhookUrl = `${serverBaseUrl}/api/webhook/human-task`;

    const newWfId = await orkesService.startWorkflow(
      webhookUrl,
      humanTaskWebhookUrl,
    );
    res.redirect(
      `/?workflowId=${newWfId}&message=Khởi tạo luồng mới thành công!`,
    );
  } catch (error: any) {
    logger.error("Failed to start workflow", error.stack);
    res.redirect(
      `/?message=Lỗi Start Workflow: ${encodeURIComponent(error.message)}`,
    );
  }
};

/**
 * POST /task/complete - Duyệt Task
 */
export const completeTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
    logger.error(`Failed to complete task ${taskId}`, error.stack);
    res.redirect(
      `/?workflowId=${workflowInstanceId}&message=Lỗi: ${encodeURIComponent(error.message)}`,
    );
  }
};

/**
 * POST /api/webhook/notify
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await processAndLogWebhook(req, "SYSTEM_NOTIFY");
  } catch (err: any) {
    logger.error("Error handling System Webhook", err.stack);
  }
  res.status(200).json({ success: true });
};

/**
 * POST /api/webhook/human-task
 */
export const handleSendHumanTaskNotify = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await processAndLogWebhook(req, "HUMAN_TASK_NOTIFY");
  } catch (err: any) {
    logger.error("Error handling Human Task Webhook", err.stack);
  }
  res.status(200).json({ success: true });
};
