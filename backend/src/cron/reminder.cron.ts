import { Queue } from "bullmq";
import { EventType } from "../events/types";
import { prisma } from "../../db/db";

const reminderQueue = new Queue("events");

export async function scheduleReminders() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const employees = await prisma.employee.findMany({
    where: {
      status: "INVITED",
      invitedAt: { lt: cutoff }
    }
  });

  for (const emp of employees) {
    await reminderQueue.add(
      EventType.EMPLOYEE_INVITED,
      {
        employeeId: emp.id,
        email: emp.email,
        name: emp.fullName,
        reminder: true
      },
      {
        jobId: `reminder:${emp.id}`, // 🔒 idempotent
        removeOnComplete: true
      }
    );
  }
}
