"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CircleHelp,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAlertFirings,
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useEvaluateAlerts,
  useUpdateAlertRule,
} from "@/hooks/useAlerts";
import {
  defaultParamsForType,
  ruleTypeLabel,
  type AlertRule,
  type AlertRuleType,
} from "@/lib/api/alerts";

function ParamsFields({
  ruleType,
  params,
  onChange,
}: {
  ruleType: AlertRuleType;
  params: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  function setField(key: string, value: number) {
    onChange({ ...params, [key]: value });
  }

  if (ruleType === "returns_rate_above") {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="p-window">
            Janela (dias)
          </label>
          <input
            id="p-window"
            type="number"
            min={1}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={params.window_days ?? 7}
            onChange={(e) => setField("window_days", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="p-max">
            Máx. (%)
          </label>
          <input
            id="p-max"
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={params.max_percent ?? 10}
            onChange={(e) => setField("max_percent", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="p-min-ev">
            Mín. eventos
          </label>
          <input
            id="p-min-ev"
            type="number"
            min={1}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={params.min_events ?? 5}
            onChange={(e) => setField("min_events", Number(e.target.value))}
          />
        </div>
      </div>
    );
  }
  if (ruleType === "revenue_drop") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="p-wd">
            Janela (dias)
          </label>
          <input
            id="p-wd"
            type="number"
            min={1}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={params.window_days ?? 7}
            onChange={(e) => setField("window_days", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="p-drop">
            Queda mín. (%)
          </label>
          <input
            id="p-drop"
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={params.drop_percent ?? 20}
            onChange={(e) => setField("drop_percent", Number(e.target.value))}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1 max-w-xs">
      <label className="text-sm font-medium" htmlFor="p-md">
        Dias sem compra (mín.)
      </label>
      <input
        id="p-md"
        type="number"
        min={1}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={params.min_days ?? 7}
        onChange={(e) => setField("min_days", Number(e.target.value))}
      />
    </div>
  );
}

function RuleDialogForm({
  editing,
  onOpenChange,
}: {
  editing: AlertRule | null;
  onOpenChange: (o: boolean) => void;
}) {
  const createMut = useCreateAlertRule();
  const updateMut = useUpdateAlertRule();
  const [ruleType, setRuleType] = useState<AlertRuleType>(
    () => editing?.rule_type ?? "returns_rate_above",
  );
  const [params, setParams] = useState<Record<string, number>>(() => {
    if (!editing) return defaultParamsForType("returns_rate_above");
    const p = editing.params as Record<string, number>;
    return { ...defaultParamsForType(editing.rule_type), ...p };
  });
  const [enabled, setEnabled] = useState(() => editing?.enabled ?? true);
  const [cooldownHours, setCooldownHours] = useState(
    () => editing?.cooldown_hours ?? 24,
  );

  function handleRuleTypeChange(t: AlertRuleType) {
    setRuleType(t);
    setParams(defaultParamsForType(t));
  }

  function submit() {
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          input: {
            rule_type: ruleType,
            params,
            enabled,
            cooldown_hours: cooldownHours,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMut.mutate(
        { rule_type: ruleType, params, enabled, cooldown_hours: cooldownHours },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  const pending = createMut.isPending || updateMut.isPending;
  const err = createMut.error ?? updateMut.error;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Editar regra" : "Nova regra"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="rule-type">
              Tipo
            </label>
            <select
              id="rule-type"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={ruleType}
              onChange={(e) => handleRuleTypeChange(e.target.value as AlertRuleType)}
              disabled={!!editing}
            >
              <option value="returns_rate_above">{ruleTypeLabel("returns_rate_above")}</option>
              <option value="revenue_drop">{ruleTypeLabel("revenue_drop")}</option>
              <option value="days_without_purchase">
                {ruleTypeLabel("days_without_purchase")}
              </option>
            </select>
            {editing && (
              <p className="text-xs text-muted-foreground">O tipo não pode ser alterado.</p>
            )}
          </div>
          <ParamsFields ruleType={ruleType} params={params} onChange={setParams} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="cooldown">
                Cooldown (horas)
              </label>
              <input
                id="cooldown"
                type="number"
                min={1}
                max={168}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={cooldownHours}
                onChange={(e) => setCooldownHours(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-input"
                />
                Regra ativa
              </label>
            </div>
          </div>
          {err && <p className="text-sm text-red-600">{err.message}</p>}
        </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="button" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </DialogFooter>
    </>
  );
}

function RuleDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: AlertRule | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <RuleDialogForm
            key={editing ? `e-${editing.id}` : "new"}
            editing={editing}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AlertsPage() {
  const { data: rules, isLoading: loadingRules, error: rulesError } = useAlertRules();
  const [firingsPage, setFiringsPage] = useState(1);
  const { data: firings, isLoading: loadingFirings } = useAlertFirings(firingsPage);
  const evaluateMut = useEvaluateAlerts();
  const deleteMut = useDeleteAlertRule();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AlertRule | null>(null);
  const [editing, setEditing] = useState<AlertRule | null>(null);

  const sortedRules = useMemo(() => {
    if (!rules) return [];
    return [...rules].sort((a, b) => a.id - b.id);
  }, [rules]);

  return (
    <>
      <RuleDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
      />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Como usar os alertas</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-left text-foreground">
                <p>
                  As <strong>regras</strong> definem quando o sistema deve registrar um alerta com
                  base nos dados da sua conta (eventos e receita). Você pode criar até{" "}
                  <strong>10 regras</strong> por conta.
                </p>
                <div>
                  <p className="font-medium text-foreground mb-1.5">Tipos de regra</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Taxa de devoluções</strong> — dispara quando a proporção de
                      devoluções no período ultrapassa o limite configurado (com número mínimo de
                      eventos para evitar ruído).
                    </li>
                    <li>
                      <strong>Queda de receita</strong> — compara a receita da janela atual com a
                      janela anterior e alerta se a queda percentual passar do limite.
                    </li>
                    <li>
                      <strong>Dias sem compra</strong> — alerta quando não há compra registrada há
                      mais dias do que o mínimo definido.
                    </li>
                  </ul>
                </div>
                <p>
                  Ao criar ou editar uma regra, ajuste <strong>janelas</strong>,{" "}
                  <strong>limiares</strong>, se a regra está <strong>ativa</strong> e o{" "}
                  <strong>cooldown</strong> (horas entre disparos repetidos da mesma regra).
                </p>
                <p>
                  Use <strong>Verificar agora</strong> para avaliar todas as regras ativas na hora.
                  Quando a condição for atendida, um novo registro aparece em{" "}
                  <strong>Últimos disparos</strong>.
                </p>
                <p>
                  O <strong>cooldown</strong> evita que o mesmo alerta dispare várias vezes seguidas
                  enquanto o intervalo não passar — útil para não poluir o histórico.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => setHelpOpen(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={ruleToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setRuleToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!deleteMut.isPending}>
          <DialogHeader>
            <DialogTitle>Excluir regra?</DialogTitle>
            <DialogDescription>
              {ruleToDelete ? (
                <>
                  Esta ação não pode ser desfeita. A regra{" "}
                  <span className="font-medium text-foreground">
                    {ruleTypeLabel(ruleToDelete.rule_type)}
                  </span>{" "}
                  será removida permanentemente, junto com o histórico de disparos associado a ela.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false} className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMut.isPending}
              onClick={() => setRuleToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (!ruleToDelete) return;
                deleteMut.mutate(ruleToDelete.id, {
                  onSuccess: () => setRuleToDelete(null),
                });
              }}
            >
              {deleteMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-[#1e2d5a] text-white shadow-lg transition-colors hover:bg-[#1e2d5a]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e2d5a] focus-visible:ring-offset-2 md:bottom-8 md:right-6"
        aria-label="Como usar os alertas"
      >
        <CircleHelp className="size-6" aria-hidden />
      </button>

      <div className="flex flex-col gap-8 pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="h-7 w-7 text-[#1e2d5a]" />
              Alertas
            </h1>
            <p className="text-sm text-muted-foreground">
              Regras operacionais com base em devoluções, receita e atividade de compra. Avalie sob
              demanda e consulte o histórico.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => evaluateMut.mutate()}
              disabled={evaluateMut.isPending}
            >
              {evaluateMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Verificar agora
            </Button>
            <Button
              type="button"
              className="bg-[#1e2d5a] hover:bg-[#1e2d5a]/90"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova regra
            </Button>
          </div>
        </div>

        {evaluateMut.isSuccess && evaluateMut.data && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {evaluateMut.data.fired.length === 0
              ? "Nenhum alerta disparado nesta execução."
              : `${evaluateMut.data.fired.length} alerta(s) disparado(s).`}
          </div>
        )}
        {evaluateMut.isError && (
          <p className="text-sm text-red-600">{(evaluateMut.error as Error).message}</p>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Regras</h2>
          {loadingRules && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {rulesError && (
            <p className="text-sm text-red-600">{(rulesError as Error).message}</p>
          )}
          {!loadingRules && sortedRules.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma regra configurada ainda.</p>
          )}
          {sortedRules.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Parâmetros</th>
                    <th className="px-3 py-2 font-medium">Cooldown</th>
                    <th className="px-3 py-2 font-medium">Ativa</th>
                    <th className="px-3 py-2 font-medium w-28" />
                  </tr>
                </thead>
                <tbody>
                  {sortedRules.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-2">{ruleTypeLabel(r.rule_type)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground max-w-[240px] truncate">
                        {JSON.stringify(r.params)}
                      </td>
                      <td className="px-3 py-2">{r.cooldown_hours} h</td>
                      <td className="px-3 py-2">{r.enabled ? "Sim" : "Não"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => {
                              setEditing(r);
                              setDialogOpen(true);
                            }}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                            disabled={deleteMut.isPending}
                            onClick={() => setRuleToDelete(r)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Últimos disparos</h2>
          {loadingFirings && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {firings && firings.items.length === 0 && (
            <p className="text-sm text-muted-foreground">Ainda não há disparos registrados.</p>
          )}
          {firings && firings.items.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Quando</th>
                      <th className="px-3 py-2 font-medium">Regra</th>
                      <th className="px-3 py-2 font-medium">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firings.items.map((f) => (
                      <tr key={f.id} className="border-t border-border align-top">
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {new Date(f.fired_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2">#{f.rule_id}</td>
                        <td className="px-3 py-2">{f.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {firings.pages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={firingsPage <= 1}
                    onClick={() => setFiringsPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {firings.page} de {firings.pages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={firingsPage >= firings.pages}
                    onClick={() => setFiringsPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
