"use client";

export function PasswordChangeForm() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Funcao bloqueada temporariamente.
      </p>
      <p className="text-xs text-muted-foreground">
        A alteracao de senha sera liberada por feature flag no backend.
      </p>
    </div>
  );
}
