"use client";

import { useState } from "react";
import { ListMusic, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { AdminQueueItem } from "@/types/adminRadio";
import { useAdminDeleteQueueItem, useAdminQueue } from "@/hooks/useAdminRadioQuery";

interface AdminLiveQueuePanelProps {
  enabled: boolean;
  onFeedback: (fb: { type: "success" | "error"; text: string } | null) => void;
}

function getQueueItemLabel(item: AdminQueueItem): string {
  const artist = item.song?.artist || item.artist || "";
  const title = item.song?.title || item.title || "";
  if (artist && title) return `${artist} - ${title}`;
  return item.song?.text || item.text || title || `Item #${item.id}`;
}

export const AdminLiveQueuePanel = ({ enabled, onFeedback }: AdminLiveQueuePanelProps) => {
  const queueQuery = useAdminQueue(enabled);
  const deleteMutation = useAdminDeleteQueueItem();
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const items = queueQuery.data ?? [];

  const handleDelete = async (item: AdminQueueItem) => {
    onFeedback(null);
    setDeletingId(item.id);
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "No se pudo eliminar el elemento de la cola.";
      onFeedback({ type: "error", text: msg });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.7rem",
          fontWeight: 900,
          color: "var(--on-surface-variant)",
        }}
      >
        <span>
          <ListMusic size={13} style={{ display: "inline", marginRight: "5px" }} />
          {queueQuery.isLoading
            ? "Consultando cola en vivo..."
            : `${items.length} ${items.length === 1 ? "canción" : "canciones"} en cola`}
        </span>

        <button
          type="button"
          disabled={queueQuery.isFetching}
          onClick={() => void queueQuery.refetch()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 9px",
            backgroundColor: "var(--surface-container)",
            color: "var(--on-background)",
            border: "1.5px solid var(--primary)",
            fontSize: "0.64rem",
            fontWeight: 900,
            cursor: queueQuery.isFetching ? "wait" : "pointer",
          }}
        >
          <RefreshCw size={12} className={queueQuery.isFetching ? "animate-spin" : ""} />
          <span>ACTUALIZAR COLA</span>
        </button>
      </div>

      {queueQuery.error && (
        <div
          style={{
            padding: "8px 10px",
            border: "2px solid var(--primary)",
            backgroundColor: "#FEE2E2",
            color: "#991B1B",
            fontSize: "0.72rem",
            fontWeight: 800,
          }}
        >
          {queueQuery.error instanceof Error
            ? queueQuery.error.message
            : "Error al cargar la cola en vivo."}
        </div>
      )}

      <div
        style={{
          maxHeight: "390px",
          overflowY: "auto",
          border: "2px solid var(--primary)",
          backgroundColor: "var(--card-bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {queueQuery.isLoading && items.length === 0 ? (
          <div
            style={{
              padding: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "0.76rem",
              fontWeight: 800,
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Cargando cola en vivo...</span>
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: "28px",
              textAlign: "center",
              fontSize: "0.74rem",
              opacity: 0.75,
              fontWeight: 700,
            }}
          >
            No hay canciones en la cola en este momento.
          </div>
        ) : (
          items.map((item, idx) => {
            const label = getQueueItemLabel(item);
            const isDeleting = deletingId === item.id;
            return (
              <div
                key={String(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "9px 12px",
                  borderBottom: "1px solid var(--surface-container)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      minWidth: "26px",
                      height: "24px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: idx === 0 ? "var(--primary-container)" : "var(--surface-container)",
                      color: idx === 0 ? "var(--on-primary-container)" : "var(--on-background)",
                      border: "1.5px solid var(--primary)",
                      fontSize: "0.66rem",
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    #{idx + 1}
                  </span>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={label}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        color: "var(--on-surface-variant)",
                        fontWeight: 700,
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      {item.is_request && <span>PEDIDO / ENCOLADA</span>}
                      {item.playlist && <span>Playlist: {item.playlist}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDelete(item)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    backgroundColor: "#FEE2E2",
                    color: "#991B1B",
                    border: "1.5px solid var(--primary)",
                    fontSize: "0.64rem",
                    fontWeight: 900,
                    cursor: isDeleting ? "wait" : "pointer",
                    flexShrink: 0,
                  }}
                  title="Eliminar de la cola"
                >
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  <span>{isDeleting ? "..." : "ELIMINAR"}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
