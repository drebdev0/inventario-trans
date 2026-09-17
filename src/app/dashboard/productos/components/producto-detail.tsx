"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Cpu, Wrench, ArrowRightLeft, Trash2 } from "lucide-react";
import type { ProductoModelo, ActivoFisico } from "@/lib/types";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Props {
  producto: ProductoModelo;
  activos: ActivoFisico[];
  onClose: () => void;
  onRefresh: () => void;
}

export function ProductoDetail({ producto, activos, onClose, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteActivo, setDeleteActivo] = useState<ActivoFisico | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const handleStatusChange = async (activoId: string, newStatus: string) => {
    setLoading(activoId);
    await supabase.from("activos_fisicos").update({ estado_actual: newStatus }).eq("id", activoId);
    onRefresh();
    setLoading(null);
  };

  const handleDeleteActivo = async () => {
    if (!deleteActivo) return;
    setDeleting(true);
    await supabase.from("activos_fisicos").delete().eq("id", deleteActivo.id);
    setDeleting(false);
    setDeleteActivo(null);
    onRefresh();
  };

  const statusColor = (estado: string) => {
    switch (estado) {
      case "En Bodega": return "bg-green-100 text-green-800";
      case "En Préstamo": return "bg-blue-100 text-blue-800";
      case "En Mantenimiento": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border w-full max-w-2xl max-h-[80vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">{producto.nombre}</h2>
            <p className="text-sm text-muted-foreground">{producto.marca_modelo}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {producto.contenido && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Contenido del Kit</p>
              <p className="text-sm text-muted-foreground">{producto.contenido}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-muted-foreground">
              Stock mínimo: <span className="font-medium text-foreground">{producto.stock_minimo_alerta}</span>
            </span>
            {producto.requiere_documento_legal && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Requiere Documento Legal
              </span>
            )}
          </div>

          <h3 className="font-semibold text-foreground mb-3">
            Activos Individuales ({activos.length})
          </h3>

          {activos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay activos registrados para este producto
            </p>
          ) : (
            <div className="space-y-2">
              {activos.map((activo) => (
                <div
                  key={activo.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm font-medium">{activo.id_codigo}</p>
                      {activo.observaciones && (
                        <p className="text-xs text-muted-foreground">{activo.observaciones}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(activo.estado_actual)}`}>
                      {activo.estado_actual}
                    </span>
                    {activo.estado_actual === "En Bodega" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(activo.id, "En Mantenimiento")}
                          disabled={loading === activo.id}
                          className="p-1 text-muted-foreground hover:text-orange-600 transition-colors"
                          title="Enviar a mantenimiento"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteActivo(activo)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar activo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {activo.estado_actual === "En Mantenimiento" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(activo.id, "En Bodega")}
                          disabled={loading === activo.id}
                          className="p-1 text-muted-foreground hover:text-green-600 transition-colors"
                          title="Devolver a bodega"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteActivo(activo)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar activo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {deleteActivo && (
        <ConfirmDialog
          title="Eliminar Activo"
          message={`¿Eliminar el activo ${deleteActivo.id_codigo}? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteActivo}
          onCancel={() => setDeleteActivo(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
