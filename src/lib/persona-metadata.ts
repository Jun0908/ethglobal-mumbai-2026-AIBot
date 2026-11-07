import { timingSafeEqual } from "node:crypto";

type CapsuleMetadata = {
  personaId: string;
  ownerId: string;
  version: number;
  consent: { simulationApproved: boolean };
};

export function isAuthorizedParent(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function personaMetadata(capsule: CapsuleMetadata) {
  if (!capsule.ownerId.startsWith("psi:") || capsule.ownerId.length <= 4) return null;
  return {
    personaId: capsule.personaId,
    ownerSubject: capsule.ownerId.slice(4),
    status: capsule.consent.simulationApproved ? "approved" : "revoked",
    version: capsule.version,
  } as const;
}
