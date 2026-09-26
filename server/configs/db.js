import prisma from "./prisma.js";

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("Successfully connected to PRISMA_DB!");
  } catch (error) {
    console.error("Failed to connect to PRISMA_DB:", error.message);
  }
}

export default connectDB;
