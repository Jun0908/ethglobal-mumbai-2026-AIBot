import assert from "node:assert/strict";
import { test } from "node:test";
import { isAuthorizedParent, personaMetadata } from "../src/lib/persona-metadata";

const secret = "s".repeat(32);
const capsule = {
  personaId: "c910e0a4-bfe6-4312-88d7-01d8d81352a0",
  ownerId: "psi:0xalice",
  version: 2,
  consent: { simulationApproved: true },
  content: { private: "never return this" },
};

test("should require a configured service token", () => {
  assert.equal(isAuthorizedParent(`Bearer ${secret}`, secret), true);
  assert.equal(isAuthorizedParent(`Bearer ${secret}x`, secret), false);
  assert.equal(isAuthorizedParent(`Bearer ${secret}`, undefined), false);
  assert.equal(isAuthorizedParent(`Bearer ${secret}`, "short"), false);
  assert.equal(isAuthorizedParent(null, secret), false);
});

test("should return only trusted owner and current approval metadata", () => {
  const approved = personaMetadata(capsule);
  assert.deepEqual(approved, {
    personaId: capsule.personaId,
    ownerSubject: "0xalice",
    status: "approved",
    version: 2,
  });
  assert.equal(JSON.stringify(approved).includes("private"), false);
  assert.equal(personaMetadata({ ...capsule, version: 3, consent: { simulationApproved: false } })?.status, "revoked");
  assert.equal(personaMetadata({ ...capsule, ownerId: "demo-owner" }), null);
});
