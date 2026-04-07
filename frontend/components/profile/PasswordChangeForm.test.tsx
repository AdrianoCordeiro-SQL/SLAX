/**
 * Testes da secao de troca de senha bloqueada temporariamente.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordChangeForm } from "./PasswordChangeForm";

describe("PasswordChangeForm", () => {
  it("exibe aviso de bloqueio e instrução de feature flag", () => {
    render(<PasswordChangeForm />);

    expect(screen.getByText(/funcao bloqueada temporariamente/i)).toBeInTheDocument();
    expect(screen.getByText(/feature flag no backend/i)).toBeInTheDocument();
  });
});
