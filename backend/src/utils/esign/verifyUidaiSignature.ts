// // utils/esign/verifyUidaiSignature.ts
// export function verifyUidaiSignature(payload: any): boolean {
//   /**
//    * REAL IMPLEMENTATION (later):
//    * - verify PKCS#7 signature
//    * - validate X.509 certificate chain
//    * - verify timestamp
//    * - match requestId
//    */

//   // TEMP: sandbox rule
//   return (
//     payload.status === "SUCCESS" &&
//     typeof payload.signature === "string"
//   );
// }

import { verifyPkcs7Signature } from "./verifyPkcs7";
import { verifyCertificateChain } from "./verifyCertificate";
import { verifyTimestamp } from "./verifyTimestamp";

export function verifyUidaiSignature(payload: any): boolean {
  if (!payload) return false;

  const { signedPdfBase64, signature, timestamp } = payload;

  if (!signedPdfBase64 || !signature || !timestamp) return false;

  if (!verifyTimestamp(timestamp)) return false;

  return verifyPkcs7Signature(
    Buffer.from(signedPdfBase64, "base64"),
    signature
  );
}

