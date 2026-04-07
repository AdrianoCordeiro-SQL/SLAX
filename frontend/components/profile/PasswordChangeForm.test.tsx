/**
 * Testes da secao de troca de senha bloqueada temporariamente.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordChangeForm } from "./PasswordChangeForm";

describe("PasswordChangeForm", () => {
  it("mantem campos e botao desabilitados com aviso de bloqueio", () => {
    render(<PasswordChangeForm />);

    expect(screen.getByLabelText(/senha atual/i)).toBeDisabled();
    expect(screen.getByLabelText(/^nova senha$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirmar nova senha/i)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /funcao bloqueada temporariamente/i }),
    ).toBeDisabled();
    expect(screen.getAllByText(/funcao bloqueada temporariamente/i).length).toBeGreaterThan(0);
  });
});
