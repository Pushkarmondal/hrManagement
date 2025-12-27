import { describe, it, expect } from "vitest";
import {
  assertTransition,
  canTransition,
  getValidTransitions,
  InvalidStateTransitionError,
  type EmployeeStatus,
} from "./state";

describe("Employee State Machine", () => {
  describe("assertTransition", () => {
    it("allows valid transitions", () => {
      expect(() => assertTransition("DRAFT", "INVITED")).not.toThrow();
      expect(() => assertTransition("INVITED", "ONBOARDING_SUBMITTED")).not.toThrow();
      expect(() => assertTransition("AGREEMENT_SENT", "SIGNED")).not.toThrow();
    });

    it("throws on invalid transitions", () => {
      expect(() => assertTransition("INVITED", "SIGNED"))
        .toThrow(InvalidStateTransitionError);
      
      expect(() => assertTransition("DRAFT", "HR_VERIFIED"))
        .toThrow("Invalid state transition: DRAFT → HR_VERIFIED");
    });

    it("throws when transitioning from terminal state", () => {
      expect(() => assertTransition("SIGNED", "DRAFT"))
        .toThrow(InvalidStateTransitionError);
    });

    it("includes allowed transitions in error message", () => {
      try {
        assertTransition("INVITED", "SIGNED");
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidStateTransitionError);
        expect((error as InvalidStateTransitionError).allowed)
          .toEqual(["ONBOARDING_SUBMITTED"]);
      }
    });
  });

  describe("canTransition", () => {
    it("returns true for valid transitions", () => {
      expect(canTransition("DRAFT", "INVITED")).toBe(true);
      expect(canTransition("HR_VERIFIED", "AGREEMENT_SENT")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(canTransition("INVITED", "SIGNED")).toBe(false);
      expect(canTransition("SIGNED", "DRAFT")).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("returns valid next states", () => {
      expect(getValidTransitions("DRAFT")).toEqual(["INVITED"]);
      expect(getValidTransitions("SIGNED")).toEqual([]);
    });
  });

  describe("complete workflow", () => {
    it("validates entire employee lifecycle", () => {
      const states: EmployeeStatus[] = [
        "DRAFT",
        "INVITED",
        "ONBOARDING_SUBMITTED",
        "HR_VERIFIED",
        "AGREEMENT_SENT",
        "SIGNED",
      ];

      for (let i = 0; i < states.length - 1; i++) {
        expect(() => assertTransition(states[i] as EmployeeStatus, states[i + 1] as EmployeeStatus)).not.toThrow();
      }
    });
  });
});