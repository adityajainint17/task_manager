import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { projectRouter } from "./project.routes.js";
import { taskRouter } from "./task.routes.js";
import { attendanceRouter } from "./attendance.routes.js";
import { leaveRouter } from "./leave.routes.js";
import { analyticsRouter } from "./analytics.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/leave", leaveRouter);
apiRouter.use("/analytics", analyticsRouter);



