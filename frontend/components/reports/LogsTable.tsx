"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReportLogs } from "@/hooks/useReports";
import type { LogItem, LogFilters, LogTransactionKind } from "@/lib/api/reports";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getTransactionDisplayLabel } from "@/lib/constants/status";
import { getInitials } from "@/lib/format";

type TransactionFilterValue = "all" | LogTransactionKind;

const TRANSACTION_FILTER: { value: TransactionFilterValue; label: string }[] = [
  { value: "all", label: "Sem filtro" },
  { value: "completed", label: "Concluída" },
  { value: "return", label: "Devolução" },
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableCell key={i}>
          <div
            className="h-4 rounded bg-gray-200 animate-pulse"
            style={{ width: i === 0 ? "8rem" : i === 1 ? "10rem" : "6rem" }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

function exportCSV(items: LogItem[]) {
  const header = "ID,User,Action,Timestamp,Transações";
  const rows = items.map(
    (i) =>
      `${i.id},"${i.user}","${i.action}","${i.timestamp}","${getTransactionDisplayLabel(i.status, i.action)}"`,
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eventos-plataforma.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface LogsTableProps {
  start: string;
  end: string;
}

export function LogsTable({ start, end }: LogsTableProps) {
  const [filters, setFilters] = useState<LogFilters>({ page: 1 });
  const [actionSearch, setActionSearch] = useState("");
  const { data, isLoading, error, isFetching } = useReportLogs(start, end, {
    ...filters,
    action: actionSearch || undefined,
  });

  const setPage = useCallback(
    (p: number) => setFilters((f) => ({ ...f, page: p })),
    [],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">Eventos da plataforma</CardTitle>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.transactionKind ?? "all"}
            onValueChange={(v) =>
              setFilters((f) => ({
                ...f,
                transactionKind:
                  v === "all" ? undefined : (v as LogTransactionKind),
                page: 1,
              }))
            }
          >
            <SelectTrigger className="h-8 min-w-[140px] max-w-[200px] text-xs">
              <SelectValue placeholder="Transação" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_FILTER.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filtrar evento..."
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value);
              setFilters((f) => ({ ...f, page: 1 }));
            }}
            className="h-8 w-[160px] text-xs"
          />

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={!data || data.items.length === 0}
            onClick={() => data && exportCSV(data.items)}
          >
            <Download size={13} />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <div className="px-6 py-3 text-sm text-red-700">
            Falha ao carregar eventos da plataforma: {error.message}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Cliente</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Transações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : data?.items.map((item) => (
                    <TableRow
                      key={item.id}
                      className={isFetching ? "opacity-60" : ""}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm">
                            {item.avatar_url && (
                              <AvatarImage
                                src={item.avatar_url}
                                alt={item.user || "Não informado"}
                              />
                            )}
                            <AvatarFallback>
                              {getInitials(item.user || "Não informado")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">
                            {item.user || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {item.action || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.timestamp ? formatTimestamp(item.timestamp) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} action={item.action} />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <span className="text-xs text-muted-foreground">
              Página {data.page} de {data.pages} ({data.total} no total)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={data.page <= 1}
                onClick={() => setPage(data.page - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={data.page >= data.pages}
                onClick={() => setPage(data.page + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
