import { Queue } from "bullmq";
import { EventType } from "./types";

export const eventQueue = new Queue("events", {
  connection: {
    host: "localhost",
    port: 6379
  }
});

export async function emitEvent(
  type: EventType,
  payload: Record<string, any>,
  idempotencyKey: string
) {
  await eventQueue.add(
    type,
    payload,
    {
      jobId: idempotencyKey, // 🔒 idempotent
      removeOnComplete: true,
      attempts: 3
    }
  );
}
