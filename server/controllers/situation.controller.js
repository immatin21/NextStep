import crypto from "crypto";
import prisma from "../configs/prisma.js";
import { analyzeSituation } from "../services/ai.service.js";
import {
  checkIdempotency,
  completeIdempotency,
  getOrCreateIdempotencyKey,
} from "../services/idempotency.service.js";

function extractAccessToken(req) {
  return (
    req.headers["x-access-token"] ||
    req.query.access_token ||
    req.query.token ||
    null
  );
}

function verifySituationAccess(situation, req) {
  if (!situation.accessToken) return true;
  const token = extractAccessToken(req);
  return token && token === situation.accessToken;
}

function generateSituationId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "sit_";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function formatVersionResponse(versionRow) {
  return {
    situation_id: versionRow.situationId,
    version: versionRow.version,
    server_time: versionRow.createdAt.toISOString(),
    mode: versionRow.mode,
    summary: versionRow.summary,
    issues: versionRow.issues,
    priorities: versionRow.priorities,
    next_action: versionRow.next_action,
    clarifying_questions: versionRow.clarifying_questions,
    missing_information: versionRow.missing_information,
    risk_flags: versionRow.risk_flags,
    confidence: versionRow.confidence,
    changes: versionRow.changes,
    support: versionRow.support,
  };
}

export async function createSituation(req, res) {
  const idempotencyKey = getOrCreateIdempotencyKey(req);
  const text = (req.body?.text || "").trim();
  const clientTime = req.body?.client_time || null;
  const candidateId = req.headers["x-candidate-id"] || null;
  const chaos = req.headers["x-chaos"] || null;

  if (!text) {
    return res.status(400).json({ error: "Text field is required" });
  }

  const idempCheck = await checkIdempotency(idempotencyKey);
  if (idempCheck.isDuplicate) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("X-Idempotent-Replay", "true");
    return res.status(idempCheck.responseCode).json(idempCheck.responseBody);
  }

  try {
    const situationId = generateSituationId();
    const accessToken = "sec_" + crypto.randomBytes(24).toString("hex");

    const analysis = await analyzeSituation({
      rawInput: text,
      clientTime,
      situationId,
      version: 1,
      candidateId,
      chaos,
    });

    await prisma.$transaction(async (tx) => {
      await tx.situation.create({
        data: {
          id: situationId,
          accessToken,
          currentVersion: 1,
          status: "active",
        },
      });

      await tx.situationVersion.create({
        data: {
          situationId,
          version: 1,
          rawInput: text,
          client_time: clientTime ? new Date(clientTime) : null,
          mode: analysis.mode,
          summary: analysis.summary,
          issues: analysis.issues,
          priorities: analysis.priorities,
          next_action: analysis.next_action,
          clarifying_questions: analysis.clarifying_questions,
          missing_information: analysis.missing_information,
          risk_flags: analysis.risk_flags,
          confidence: analysis.confidence,
          changes: [],
          support: analysis.support,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "SITUATION_CREATED",
          payload: {
            situationId,
            version: 1,
            mode: analysis.mode,
            textSnippet: text.substring(0, 100),
          },
          ipAddress: req.ip,
        },
      });
    });

    const responsePayload = {
      ...analysis,
      access_token: accessToken,
    };

    await completeIdempotency(
      idempotencyKey,
      situationId,
      200,
      responsePayload,
    );

    res.setHeader("X-Cache", "MISS");
    res.setHeader("X-Access-Token", accessToken);
    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("Error creating situation:", err);
    return res
      .status(500)
      .json({ error: "Failed to process situation", details: err.message });
  }
}

export async function getSituation(req, res) {
  const { id } = req.params;

  try {
    const situation = await prisma.situation.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!situation || situation.versions.length === 0) {
      return res.status(404).json({ error: "Situation not found" });
    }

    if (!verifySituationAccess(situation, req)) {
      return res.status(403).json({
        error:
          "Access denied. A valid X-Access-Token header is required to access this situation.",
      });
    }

    const latest = situation.versions[0];
    return res.status(200).json(formatVersionResponse(latest));
  } catch (err) {
    console.error("Error getting situation:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateSituation(req, res) {
  const { id } = req.params;
  const text = (req.body?.text || "").trim();
  const clientTime = req.body?.client_time || null;
  const idempotencyKey = getOrCreateIdempotencyKey(req);

  if (!text) {
    return res.status(400).json({ error: "Update text is required" });
  }

  const idempCheck = await checkIdempotency(idempotencyKey);
  if (idempCheck.isDuplicate) {
    res.setHeader("X-Cache", "HIT");
    return res.status(idempCheck.responseCode).json(idempCheck.responseBody);
  }

  try {
    const situation = await prisma.situation.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!situation || situation.versions.length === 0) {
      return res.status(404).json({ error: "Situation not found" });
    }

    if (!verifySituationAccess(situation, req)) {
      return res.status(403).json({
        error:
          "Access denied. A valid X-Access-Token header is required to update this situation.",
      });
    }

    const previousVersion = situation.versions[0];
    const newVersionNum = previousVersion.version + 1;

    const analysis = await analyzeSituation({
      rawInput: text,
      clientTime,
      situationId: id,
      version: newVersionNum,
      previousVersion: formatVersionResponse(previousVersion),
    });

    await prisma.$transaction(async (tx) => {
      await tx.situationVersion.create({
        data: {
          situationId: id,
          version: newVersionNum,
          rawInput: text,
          client_time: clientTime ? new Date(clientTime) : null,
          mode: analysis.mode,
          summary: analysis.summary,
          issues: analysis.issues,
          priorities: analysis.priorities,
          next_action: analysis.next_action,
          clarifying_questions: analysis.clarifying_questions,
          missing_information: analysis.missing_information,
          risk_flags: analysis.risk_flags,
          confidence: analysis.confidence,
          changes: analysis.changes,
          support: analysis.support,
        },
      });

      await tx.situation.update({
        where: { id },
        data: { currentVersion: newVersionNum },
      });

      await tx.auditLog.create({
        data: {
          action: "SITUATION_UPDATED",
          payload: {
            situationId: id,
            version: newVersionNum,
            diffCount: analysis.changes.length,
          },
          ipAddress: req.ip,
        },
      });
    });

    await completeIdempotency(idempotencyKey, id, 200, analysis);

    return res.status(200).json(analysis);
  } catch (err) {
    console.error("Error updating situation:", err);
    return res
      .status(500)
      .json({ error: "Failed to update situation", details: err.message });
  }
}

export async function answerQuestions(req, res) {
  const { id } = req.params;
  const answers = req.body?.answers || [];

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "Answers array is required" });
  }

  const answersSummary = answers
    .map((a) => `Question ${a.question_id}: ${a.answer || "Skipped"}`)
    .join(". ");

  req.body.text = `Clarification answers provided: ${answersSummary}`;
  return updateSituation(req, res);
}

export async function deleteSituationData(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.situation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Situation not found" });
    }

    if (!verifySituationAccess(existing, req)) {
      return res.status(403).json({
        error:
          "Access denied. A valid X-Access-Token header is required to delete this situation.",
      });
    }

    const [delVersions, delIdemp, delSituation] = await prisma.$transaction([
      prisma.situationVersion.deleteMany({ where: { situationId: id } }),
      prisma.idempotencyRecord.deleteMany({ where: { situationId: id } }),
      prisma.situation.delete({ where: { id } }),
    ]);

    await prisma.auditLog.create({
      data: {
        action: "DATA_DELETION_EXECUTED",
        payload: {
          purgedSituationId: id,
          versionsDeleted: delVersions.count,
          idempotencyRecordsDeleted: delIdemp.count,
        },
        ipAddress: req.ip,
      },
    });

    return res.status(200).json({
      success: true,
      purged: true,
      message:
        "All data including history, logs, and prompt caches have been permanently purged.",
      records_deleted: delVersions.count + delIdemp.count + 1,
    });
  } catch (err) {
    console.error("Error purging data:", err);
    return res
      .status(500)
      .json({ error: "Failed to purge user data", details: err.message });
  }
}
