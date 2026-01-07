import forge from "node-forge";

export function verifyPkcs7Signature(
  document: Buffer,
  signatureBase64: string
): boolean {
  try {
    const der = forge.util.decode64(signatureBase64);
    const asn1 = forge.asn1.fromDer(der);

    // IMPORTANT:
    // node-forge typings are incomplete for PKCS#7
    // We intentionally escape the type system here
    const p7: any = forge.pkcs7.messageFromAsn1(asn1);

    // Detached signature verification (UIDAI-style)
    const verified = p7.verifyDetached({
      content: forge.util.createBuffer(document.toString("binary"))
    });

    return verified === true;
  } catch (err) {
    console.error("PKCS#7 detached verification failed:", err);
    return false;
  }
}
