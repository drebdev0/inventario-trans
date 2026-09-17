"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Handshake, CheckCircle, Loader2 } from "lucide-react";
import type { ActivoFisico, ProductoModelo, RTO } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

interface SelectedActivo {
  id: string;
  id_codigo: string;
  producto_nombre: string;
}

export function PrestamoBulkForm({ onClose, onSaved }: Props) {
  const [activos, setActivos] = useState<(ActivoFisico & { producto?: ProductoModelo })[]>([]);
  const [rtos, setRTOs] = useState<RTO[]>([]);
  const [selectedActivos, setSelectedActivos] = useState<SelectedActivo[]>([]);
  const [searchActivo, setSearchActivo] = useState("");
  const [rtoId, setRtoId] = useState("");
  const [personaNombre, setPersonaNombre] = useState("");
  const [personaCelular, setPersonaCelular] = useState("");
  const [personaCiudad, setPersonaCiudad] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(0);
  const [done, setDone] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [activosRes, rtosRes] = await Promise.all([
        supabase
          .from("activos_fisicos")
          .select("*, producto:productos_modelo(*)")
          .eq("estado_actual", "En Bodega"),
        supabase.from("rto").select("*").eq("estado", "Activa"),
      ]);
      setActivos((activosRes.data || []) as (ActivoFisico & { producto?: ProductoModelo })[]);
      setRTOs((rtosRes.data || []) as RTO[]);
    };
    fetchData();
  }, []);

  const filteredActivos = activos.filter(
    (a) =>
      !selectedActivos.find((s) => s.id === a.id) &&
      (a.id_codigo.toLowerCase().includes(searchActivo.toLowerCase()) ||
        a.producto?.nombre.toLowerCase().includes(searchActivo.toLowerCase()))
  );

  const toggleActivo = (activo: ActivoFisico & { producto?: ProductoModelo }) => {
    if (selectedActivos.find((s) => s.id === activo.id)) {
      setSelectedActivos(selectedActivos.filter((s) => s.id !== activo.id));
    } else {
      setSelectedActivos([
        ...selectedActivos,
        {
          id: activo.id,
          id_codigo: activo.id_codigo,
          producto_nombre: activo.producto?.nombre || "N/A",
        },
      ]);
    }
  };

  const removeActivo = (id: string) => {
    setSelectedActivos(selectedActivos.filter((s) => s.id !== id));
  };

  const handleBulkCreate = async () => {
    if (selectedActivos.length === 0 || !rtoId || !personaNombre || !personaCelular || !personaCiudad) {
      setError("Completá todos los campos y seleccioná al menos un activo");
      return;
    }

    setLoading(true);
    setError(null);
    setCreated(0);

    // Check if any selected asset requires legal document
    const needsDoc = activos.some(
      (a) => selectedActivos.find((s) => s.id === a.id) && a.producto?.requiere_documento_legal
    );

    for (let i = 0; i < selectedActivos.length; i++) {
      const activo = activos.find((a) => a.id === selectedActivos[i].id);
      const requiereDoc = activo?.producto?.requiere_documento_legal || false;

      const { error: insertError } = await supabase.from("prestamos").insert({
        activo_id: selectedActivos[i].id,
        rto_id: rtoId,
        persona_nombre: personaNombre,
        persona_celular: personaCelular,
        persona_ciudad: personaCiudad,
        fecha_prestamo: new Date().toISOString(),
        fecha_estimada_devolucion: fechaEstimada || null,
        observaciones_prestamo: observaciones || null,
        estado_documento: requiereDoc ? "Enviado_Pendiente" : "No Aplica",
      });

      if (insertError) {
        setError(`Error al crear préstamo ${i + 1}: ${insertError.message}`);
        setLoading(false);
        return;
      }
      setCreated(i + 1);
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-border w-full max-w-md shadow-xl">
          <div className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">¡Listo!</h2>
            <p className="text-muted-foreground mb-1">
              Se crearon <strong>{created}</strong> préstamos correctamente.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Los activos seleccionados ahora están en estado "En Préstamo".
            </p>
            <button
              onClick={() => { onSaved(); onClose(); }}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Préstamo en Lote</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Select assets */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Seleccionar Activos Disponibles ({selectedActivos.length} seleccionados)
            </label>
            <input
              type="text"
              placeholder="Buscar activo por código o producto..."
              value={searchActivo}
              onChange={(e) => setSearchActivo(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm mb-2"
            />

            {/* Selected assets chips */}
            {selectedActivos.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedActivos.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                  >
                    {a.id_codigo}
                    <button onClick={() => removeActivo(a.id)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-40 overflow-auto border border-border rounded-lg divide-y divide-border">
              {filteredActivos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay activos disponibles
                </p>
              ) : (
                filteredActivos.slice(0, 20).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => toggleActivo(a)}
                    className="flex items-center justify-between p-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleActivo(a)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <span className="font-mono text-xs">{a.id_codigo}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.producto?.nombre}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 2: Select RTO */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">RTO Destino *</label>
            <select
              value={rtoId}
              onChange={(e) => setRtoId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
            >
              <option value="">Seleccionar RTO...</option>
              {rtos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.ciudad_sede}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Receiver info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
              <input
                type="text"
                value={personaNombre}
                onChange={(e) => setPersonaNombre(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                placeholder="Responsable"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Celular *</label>
              <input
                type="text"
                value={personaCelular}
                onChange={(e) => setPersonaCelular(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                placeholder="300 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ciudad *</label>
              <input
                type="text"
                value={personaCiudad}
                onChange={(e) => setPersonaCiudad(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                placeholder="Ciudad destino"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha Estimada (opcional)</label>
              <input
                type="date"
                value={fechaEstimada}
                onChange={(e) => setFechaEstimada(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Observaciones</label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                placeholder="Notas de entrega"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <div className="text-sm">
                <span className="font-medium">Creando préstamos...</span>
                <span className="text-muted-foreground ml-1">{created} de {selectedActivos.length}</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(created / selectedActivos.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleBulkCreate}
            disabled={loading || selectedActivos.length === 0 || !rtoId || !personaNombre || !personaCelular || !personaCiudad}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creando..." : `Crear ${selectedActivos.length} Préstamos`}
          </button>
        </div>
      </div>
    </div>
  );
}
