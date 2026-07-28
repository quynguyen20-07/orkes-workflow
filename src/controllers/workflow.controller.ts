import { Request, Response } from "express";
import { OrkesService } from "../services/orkes.service";

const orkesService = new OrkesService();

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const wfName = "Performance_Review_Mock_Workflow"; // Tên workflow của bạn
    const wfId = req.query.workflowId as string;
    const message = req.query.message || "";

    // 1. Luôn kéo bản vẽ gốc (Def) về
    const workflowDef: any = await orkesService.getWorkflowDef(wfName);
    let workflowExe: any = null;
    let pendingTask: any = null;
    let completedTasks: any[] = [];

    // 2. Nếu đang xem 1 luồng cụ thể, kéo trạng thái thực tế về
    if (wfId) {
      workflowExe = await orkesService.getWorkflowDetails(wfId);

      // Tìm task đang chờ
      pendingTask = workflowExe.tasks.find(
        (t: any) =>
          (t.status === "IN_PROGRESS" || t.status === "SCHEDULED") &&
          t.taskDefName === "mock_human_task",
      );

      // Lọc các task đã xong và có comment để hiển thị lịch sử
      completedTasks = workflowExe.tasks.filter(
        (t: any) =>
          t.status === "COMPLETED" && t.outputData && t.outputData.comments,
      );
    }

    res.render("dashboard", {
      workflowDef,
      workflowExe,
      pendingTask,
      completedTasks,
      message,
      wfId,
    });
  } catch (error: any) {
    res.status(500).send(`Lỗi hệ thống: ${error.message}`);
  }
};

// Hàm Start giữ nguyên logic cũ, chỉ đổi chỗ redirect
export const startWorkflow = async (req: Request, res: Response) => {
  try {
    const wfName = "Performance_Review_Mock_Workflow";
    const runningWfs = await orkesService.getRunningWorkflows(wfName);

    if (runningWfs && runningWfs.length > 0) {
      for (const oldWfId of runningWfs) {
        await orkesService.terminateWorkflow(oldWfId, "Khởi tạo luồng mới");
      }
    }

    const host = req.get("host");
    const serverBaseUrl = process.env.PUBLIC_URL || `${req.protocol}://${host}`;
    const webhookUrl = `${serverBaseUrl}/api/webhook/notify`;

    const newWfId = await orkesService.startWorkflow(webhookUrl);
    // Xong thì redirect thẳng về dashboard kèm ID
    res.redirect(`/?workflowId=${newWfId}&message=Khởi tạo thành công!`);
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
      `/?workflowId=${workflowInstanceId}&message=Đã hoàn thành Task!`,
    );
  } catch (error: any) {
    res.redirect(
      `/?workflowId=${workflowInstanceId}&message=Lỗi: ${error.message}`,
    );
  }
};

export const handleWebhook = (req: Request, res: Response) => {
  res.status(200).json({ success: true });
};
