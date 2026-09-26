import { Router } from "express";
import {
  answerQuestions,
  createSituation,
  getSituation,
  deleteSituationData,
  updateSituation,
} from "../controllers/situation.controller.js";

const router = Router();

router.post("/", createSituation);
router.get("/:id", getSituation);
router.post("/:id/updates", updateSituation);
router.post("/:id/answers", answerQuestions);
router.delete("/:id", deleteSituationData);

export default router;
