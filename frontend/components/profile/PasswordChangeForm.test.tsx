/**
 * Testes de validação do formulário de troca de senha (RHF + Zod).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PasswordChangeForm } from "./PasswordChangeForm";

vi.mock("@/hooks/useAccount", () => ({
  useChangePassword: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
}));

describe("PasswordChangeForm", () => {
  it("mostra erro quando as novas senhas não coincidem", async () => {
    const user = userEvent.setup();
    render(<PasswordChangeForm />);

    await user.type(screen.getByLabelText(/senha atual/i), "oldpass");
    await user.type(screen.getByLabelText(/^nova senha$/i), "123456");
    await user.type(screen.getByLabelText(/confirmar nova senha/i), "999999");

    await user.click(screen.getByRole("button", { name: /alterar senha/i }));

    expect(await screen.findByText(/não coincidem/i)).toBeInTheDocument();
  });
});
