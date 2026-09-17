"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Handshake } from "lucide-react";
import type { Prestamo, ActivoFisico, RTO } from "@/lib/types";

interface Props {
  prestamo: Prestamo & { activo?: ActivoFisico; rto?: RTO };
  rtos: RTO[];
  onClose: () => void;
  onSaved: () => void;
}

export function PrestamoEditForm({ prestamo, rtos, onClose, onSaved }: Props) {
  const [rtoId, setRtoId] = useState(prestamo.rto_id);
  const [personaNombre, setPersonaNombre] = useState(prestamo.persona_nombre);
  const [personaCelular, setPersonaCelular] = useState(prestamo.persona_celular);
  const [personaCiudad, setPersonaCiudad] = useState(prestamo.persona_ciudad);
  const [fechaEstimada, setFechaEstimada] = useState(prestamo.fecha_estimada_devolucion || "");
  const [estadoDocumento, setEstadoDocumento] = useState(prestamo.estado_documento);
  const [observaciones, setObservaciones] = useState(prestamo.observaciones_prestamo || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("prestamos")
      .update({
        rto_id: rtoId,
        persona_nombre: personaNombre,
        persona_celular: personaCelular,
        persona_ciudad: personaCiudad,
        fecha_estimada_devolucion: fechaEstimada || null,
        estado_documento: estadoDocumento,
        observaciones_prestamo: observaciones || null,
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
      <div className="bg-white rounded-xl border border-border w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Editar Préstamo</h2>
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
            <p className="text-sm text-muted-foreground">Activo:</p>
            <p className="font-mono font-medium">{prestamo.activo?.id_codigo || "N/A"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">RTO *</label>
            <select
              value={rtoId}
              onChange={(e) => setRtoId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
            >
              {rtos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.ciudad_sede}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
              <input
                type="text"
                value={personaNombre}
                onChange={(e) => setPersonaNombre(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Celular *</label>
              <input
                type="text"
                value={personaCelular}
                onChange={(e) => setPersonaCelular(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ciudad *</label>
              <input
                type="text"
                value={personaCiudad}
                onChange={(e) => setPersonaCiudad(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha Estimada</label>
              <input
                type="date"
                value={fechaEstimada}
                onChange={(e) => setFechaEstimada(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Estado Documento</label>
            <select
              value={estadoDocumento}
              onChange={(e) => setEstadoDocumento(e.target.value as "No Aplica" | "Enviado_Pendiente" | "Diligenciado")}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
            >
              <option value="No Aplica">No Aplica</option>
              <option value="Enviado_Pendiente">Enviado / Pendiente</option>
              <option value="Diligenciado">Diligenciado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm"
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
