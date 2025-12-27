export type EmployeeStatus =
  | "DRAFT"
  | "INVITED"
  | "ONBOARDING_SUBMITTED"
  | "HR_VERIFIED"
  | "AGREEMENT_SENT"
  | "SIGNED";

const EMPLOYEE_STATE_TRANSITIONS: Record<EmployeeStatus, EmployeeStatus[]> = {
  DRAFT: ["INVITED"],
  INVITED: ["ONBOARDING_SUBMITTED"],
  ONBOARDING_SUBMITTED: ["HR_VERIFIED"],
  HR_VERIFIED: ["AGREEMENT_SENT"],
  AGREEMENT_SENT: ["SIGNED"],
  SIGNED: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly current: EmployeeStatus,
    public readonly attempted: EmployeeStatus,
    public readonly allowed: EmployeeStatus[]
  ) {
    super(
      `Invalid state transition: ${current} → ${attempted}. ` +
      `Allowed transitions: [${allowed.join(", ") || "none"}]`
    );
    this.name = "InvalidStateTransitionError";
  }
}

export function assertTransition(
  current: EmployeeStatus,
  next: EmployeeStatus
): void {
  const allowed = EMPLOYEE_STATE_TRANSITIONS[current];

  if (!allowed.includes(next)) {
    throw new InvalidStateTransitionError(current, next, allowed);
  }
}

export function canTransition(
  current: EmployeeStatus,
  next: EmployeeStatus
): boolean {
  const allowed = EMPLOYEE_STATE_TRANSITIONS[current];
  return allowed.includes(next);
}

// Utility to get all valid next states
export function getValidTransitions(current: EmployeeStatus): EmployeeStatus[] {
  return EMPLOYEE_STATE_TRANSITIONS[current] ?? [];
}

// For debugging/admin panels
export function getAllTransitions(): Record<EmployeeStatus, EmployeeStatus[]> {
  return { ...EMPLOYEE_STATE_TRANSITIONS };
}