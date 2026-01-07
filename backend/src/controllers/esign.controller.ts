import { prisma } from "../../db/db";

export const redirectToEsign = async (req: any, res: any) => {
  const employeeId = req.employee.id;

  const agreement = await prisma.agreement.findFirst({
    where: {
      employeeId,
      status: "SENT"
    }
  });

  if (!agreement) {
    return res.status(400).json({
      success: false,
      error: "No agreement available for signing"
    });
  }

  const fakeEspRedirectUrl =
    `https://esp-sandbox.example.com/esign?requestId=${agreement.id}`;

  // UX only — NO DB CHANGE
  return res.redirect(fakeEspRedirectUrl);
};
