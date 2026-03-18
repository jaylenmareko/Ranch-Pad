import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import ranchRouter from "./ranch.js";
import animalsRouter from "./animals.js";
import medicationsRouter from "./medications.js";
import healthEventsRouter from "./health-events.js";
import famachaRouter from "./famacha.js";
import fieldNotesRouter from "./field-notes.js";
import alertsRouter from "./alerts.js";
import weatherRouter from "./weather.js";
import upcomingRouter from "./upcoming.js";
import billingRouter from "./billing.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ranchRouter);
router.use(animalsRouter);
router.use(medicationsRouter);
router.use(healthEventsRouter);
router.use(famachaRouter);
router.use(fieldNotesRouter);
router.use(alertsRouter);
router.use(weatherRouter);
router.use(upcomingRouter);
router.use(billingRouter);

export default router;
