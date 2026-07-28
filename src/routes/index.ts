import { Router } from "express";
import * as WorkflowCtrl from "../controllers/workflow.controller";

const router = Router();

router.get("/", WorkflowCtrl.getDashboard);

router.post("/workflow/start", WorkflowCtrl.startWorkflow);

router.post("/task/complete", WorkflowCtrl.completeTask);

router.post("/api/webhook/notify", WorkflowCtrl.handleWebhook);

export default router;
