import forge from "node-forge";
import fs from "fs";

const UIDAI_ROOT_CA = fs.readFileSync(
  "./certs/uidai-root-ca.pem",
  "utf8"
);

export function verifyCertificateChain(certChainPem: string[]): boolean {
  try {
    const caStore = forge.pki.createCaStore([UIDAI_ROOT_CA]);

    const certs = certChainPem.map(cert =>
      forge.pki.certificateFromPem(cert)
    );

    forge.pki.verifyCertificateChain(caStore, certs);
    return true;
  } catch (err) {
    console.error("Certificate chain invalid", err);
    return false;
  }
}
