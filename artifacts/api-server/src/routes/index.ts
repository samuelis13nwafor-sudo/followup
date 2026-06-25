import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pushRouter from "./push";
import remindersRouter from "./reminders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pushRouter);
router.use(remindersRouter);

export default router;
