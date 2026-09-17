"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Cpu } from "lucide-react";
import type { ActivoFisico, ProductoModelo } from "@/lib/types";

interface Props {
  activo: ActivoFisico;
  productos: ProductoModelo[];
  onClose: () => void;
  onSaved: () => void;
}

export function ActivoEditForm({ activo, productos, onClose, onSaved }: Props) {
  const [productoId, setProductoId] = useState(activo.producto_id);
  const [estadoActual, setEstadoActual] = useState(activo.estado_actual);
  const [observaciones, setObservaciones] = useState(activo.observaciones || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("activos_fisicos")
      .update({
        producto_id: productoId,
        estado_actual: estadoActual,
        observaciones: observaciones || null,
      })
      .eq("id", activo.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Editar Activo</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Código:</p>
            <p className="font-mono font-medium">{activo.id_codigo}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Producto *</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
            >
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.marca_modelo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Estado *</label>
            <select
              value={estadoActual}
              onChange={(e) => setEstadoActual(e.target.value as "En Bodega" | "En Préstamo" | "En Mantenimiento")}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
            >
              <option value="En Bodega">En Bodega</option>
              <option value="En Préstamo">En Préstamo</option>
              <option value="En Mantenimiento">En Mantenimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm"
              placeholder="Estado físico, desgaste, notas..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Actualizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
