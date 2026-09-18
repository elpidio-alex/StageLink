import { describe, expect, it } from "vitest";
import { LedgerDirection } from "@prisma/client";
import {
  assertBalanced,
  commissionFor,
  depositPlan,
  disputePlan,
  holdPlan,
  refundPlan,
  releasePlan,
  signedAmount,
} from "@/lib/ledger";

describe("ledger escrow", () => {
  it("enregistre un dépôt positif en XOF", () => {
    const [movement] = depositPlan(
      "wallet-company",
      "company",
      125000,
      "deposit:test",
    );
    expect(movement.amount).toBe(125000);
    expect(movement.direction).toBe(LedgerDirection.CREDIT);
  });

  it("bloque les fonds avec deux mouvements équilibrés", () => {
    const movements = holdPlan(
      "wallet-company",
      "wallet-escrow",
      "company",
      "escrow",
      "contract-1",
      100000,
    );
    expect(movements.map(signedAmount).reduce((a, b) => a + b, 0)).toBe(0);
    expect(movements[0].direction).toBe(LedgerDirection.DEBIT);
  });

  it("libère le montant moins 8% et équilibre trois écritures", () => {
    const movements = releasePlan(
      "escrow",
      "student",
      "platform",
      "escrow-user",
      "student",
      "platform",
      "contract-2",
      125000,
    );
    expect(commissionFor(125000)).toBe(10000);
    expect(movements[1].amount).toBe(115000);
    expect(movements[2].amount).toBe(10000);
    expect(() => assertBalanced(movements)).not.toThrow();
  });

  it("rembourse intégralement le séquestre à l'entreprise", () => {
    const movements = refundPlan(
      "escrow",
      "company",
      "escrow-user",
      "company",
      "contract-3",
      50000,
    );
    expect(movements[1].amount).toBe(50000);
    expect(() => assertBalanced(movements)).not.toThrow();
  });

  it("rejette les montants invalides", () => {
    expect(() => commissionFor(0)).toThrow();
    expect(() =>
      releasePlan("e", "s", "p", "eu", "su", "pu", "contract-4", -1),
    ).toThrow();
  });

  it("répartit les fonds selon la décision du médiateur", () => {
    const movements = disputePlan(
      "escrow",
      "student",
      "company",
      "escrow-user",
      "student",
      "company",
      "contract-5",
      100000,
      65,
    );
    expect(movements[1].amount).toBe(65000);
    expect(movements[2].amount).toBe(35000);
    expect(() => assertBalanced(movements)).not.toThrow();
  });
});
