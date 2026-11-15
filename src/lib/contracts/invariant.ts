/**
 * =====================================================================
 * FORMAL CONTRACTS & INVARIANTS CORE (src/lib/contracts/invariant.ts)
 * =====================================================================
 * Primitivas puras de verificación formal inspiradas en Lean 4 y DbC.
 * Permite modelar invariantes matemáticas, pre-condiciones y post-condiciones.
 */

export interface InvariantViolation {
  invariantId: string;
  description: string;
  actual: unknown;
  expected: unknown;
}

export interface VerificationResult {
  isValid: boolean;
  violations: InvariantViolation[];
}

export class ContractError extends Error {
  public readonly violations: InvariantViolation[];

  constructor(message: string, violations: InvariantViolation[] = []) {
    super(
      `${message}${violations.length > 0
        ? `\nViolaciones detectadas:\n${violations
          .map(
            (v) =>
              `  - [${v.invariantId}] ${v.description} | Esperado: ${JSON.stringify(
                v.expected
              )} | Obtenido: ${JSON.stringify(v.actual)}`
          )
          .join("\n")}`
        : ""
      }`
    );
    this.name = "ContractError";
    this.violations = violations;
  }
}

/**
 * Validador estricto de invariantes
 */
export function checkInvariants<TState>(
  state: TState,
  invariants: Array<{
    id: string;
    description: string;
    predicate: (s: TState) => boolean;
    getActual?: (s: TState) => unknown;
    getExpected?: (s: TState) => unknown;
  }>
): VerificationResult {
  const violations: InvariantViolation[] = [];

  for (const inv of invariants) {
    try {
      const holds = inv.predicate(state);
      if (!holds) {
        violations.push({
          invariantId: inv.id,
          description: inv.description,
          actual: inv.getActual ? inv.getActual(state) : "falsy",
          expected: inv.getExpected ? inv.getExpected(state) : "truthy",
        });
      }
    } catch (err) {
      violations.push({
        invariantId: inv.id,
        description: `Excepción evaluando invariante: ${err instanceof Error ? err.message : String(err)}`,
        actual: "Error",
        expected: "No error",
      });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Lanza una excepción si algún invariante no se cumple (útil en dev y simulaciones)
 */
export function assertInvariants<TState>(
  state: TState,
  invariants: Array<{
    id: string;
    description: string;
    predicate: (s: TState) => boolean;
    getActual?: (s: TState) => unknown;
    getExpected?: (s: TState) => unknown;
  }>,
  contextMessage = "Violación de Invariante Formal"
): void {
  const result = checkInvariants(state, invariants);
  if (!result.isValid) {
    throw new ContractError(contextMessage, result.violations);
  }
}

