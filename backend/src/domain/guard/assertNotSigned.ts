import { EmployeeStatus } from "../../generated/prisma/enums";


export function assertNotSigned(status: EmployeeStatus): void {
  if (status === EmployeeStatus.SIGNED) {
    const err = new Error(
      "Employee data is locked after agreement signing"
    );
    (err as any).code = "DATA_LOCKED";
    throw err;
  }
}
