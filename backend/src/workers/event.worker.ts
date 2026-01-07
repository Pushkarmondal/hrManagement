import { Worker } from "bullmq";
import { EventType } from "../events/types";
import { sendEmail } from "../email/mailer";
import { inviteTemplate } from "../email/emailTemplate";
import { prisma } from "../../db/db";

new Worker(
  "events",
  async (job) => {
    const { name, data } = job;

    switch (name) {
      case EventType.EMPLOYEE_INVITED: {
        const employee = await prisma.employee.findUnique({
          where: { id: data.employeeId }
        });

        if (!employee) return;

        // 🛑 Stop if already submitted
        if (employee.status !== "INVITED") return;

        const tpl = inviteTemplate({
          name: data.name,
          inviteLink: `https://app.glowbook.in/onboarding/${employee.id}`
        });

        await sendEmail(employee.email, tpl.subject, tpl.html);
        break;
      }
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379
    }
  }
);
