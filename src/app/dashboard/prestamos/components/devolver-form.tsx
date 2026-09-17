"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, RotateCcw } from "lucide-react";
import type { Prestamo, ActivoFisico } from "@/lib/types";

interface Props {
  prestamo: Prestamo & { activo?: ActivoFisico };
  onClose: () => void;
  onSaved: () => void;
}

export function DevolverForm({ prestamo, onClose, onSaved }: Props) {
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleReturn = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("prestamos")
      .update({
        fecha_devolucion_real: new Date().toISOString(),
        observaciones_prestamo: prestamo.observaciones_prestamo
          ? `${prestamo.observaciones_prestamo}\n[Devolución] ${observaciones}`
          : observaciones || null,
      })
      .eq("id", prestamo.id);

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
            <RotateCcw className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Devolver Activo</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Código:</span>
              <span className="font-mono font-medium">{prestamo.activo?.id_codigo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Responsable:</span>
              <span className="font-medium">{prestamo.persona_nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha préstamo:</span>
              <span>{new Date(prestamo.fecha_prestamo).toLocaleDateString("es-CO")}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Observaciones de devolución
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm"
              placeholder="Estado del equipo al retorno, daños, notas..."
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleReturn}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Confirmar Devolución"}
          </button>
        </div>
      </div>
    </div>
  );
}
