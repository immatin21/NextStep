import crypto from "crypto";
import prisma from "../configs/prisma.js";

export function getOrCreateIdempotencyKey(req) {
  const headerKey = req.headers["X-Idempotency-Key"] ;
  if (headerKey && typeof headerKey === "string" && headerKey.trim().length > 0) {
    return headerKey.trim();
  }

  const text = req.body?.text || "";
  const candidateId = req.headers["X-Candidate-Id"] ;
  const timeWindow = Math.floor(Date.now() / 2500);

  return crypto
    .createHash("sha256")
    .update(`${candidateId}:${text}:${timeWindow}`)
    .digest("hex")
    .substring(0, 32);
}

export async function checkIdempotency(key) {
  try {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { key },
    });

    if (existing) {
      if (existing.status === "completed") {
        return {
          isDuplicate: true,
          responseBody: existing.responseBody,
          responseCode: existing.responseCode || 200,
          key,
        };
      }
      return {
        isDuplicate: false,
        isPending: true,
        key,
      };
    }

    await prisma.idempotencyRecord.create({
      data: {
        key,
        status: "pending",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { isDuplicate: false, isPending: false, key };
  } catch (err) {
    console.warn("Idempotency store check failed:", err.message);
    return { isDuplicate: false, isPending: false, key };
  }
}

export async function completeIdempotency(key, situationId, responseCode, responseBody) {
  try {
    await prisma.idempotencyRecord.upsert({
      where: { key },
      update: {
        status: "completed",
        situationId,
        responseCode,
        responseBody,
      },
      create: {
        key,
        status: "completed",
        situationId,
        responseCode,
        responseBody,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    console.warn("Failed to save idempotency result:", err.message);
  }
}
