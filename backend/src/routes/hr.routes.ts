import { requireHRAdmin } from "../controllers/hr.controller";
import { rejectOnboarding, verifyOnboarding } from "../controllers/onboarding.controller";


export const registerHRRoutes = (app: any) => {
  app.post(
    "/hr/onboarding/:id/verify",
    requireHRAdmin,
    verifyOnboarding
  );

  app.post(
    "/hr/onboarding/:id/reject",
    requireHRAdmin,
    rejectOnboarding
  );
};
