"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import type { ActivoFisico, ProductoModelo, RTO } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export function PrestamoForm({ onClose, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [activos, setActivos] = useState<(ActivoFisico & { producto?: ProductoModelo })[]>([]);
  const [rtos, setRTOs] = useState<RTO[]>([]);
  const [selectedActivo, setSelectedActivo] = useState<ActivoFisico | null>(null);
  const [selectedRTO, setSelectedRTO] = useState<RTO | null>(null);
  const [personaNombre, setPersonaNombre] = useState("");
  const [personaCelular, setPersonaCelular] = useState("");
  const [personaCiudad, setPersonaCiudad] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchActivo, setSearchActivo] = useState("");
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
      a.id_codigo.toLowerCase().includes(searchActivo.toLowerCase()) ||
      a.producto?.nombre.toLowerCase().includes(searchActivo.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedActivo || !selectedRTO || !personaNombre || !personaCelular || !personaCiudad) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    const requiereDoc = selectedActivo.producto?.requiere_documento_legal || false;

    const { data: prestamo, error: prestamoError } = await supabase
      .from("prestamos")
      .insert({
        activo_id: selectedActivo.id,
        rto_id: selectedRTO.id,
        persona_nombre: personaNombre,
        persona_celular: personaCelular,
        persona_ciudad: personaCiudad,
        fecha_prestamo: new Date().toISOString(),
        fecha_estimada_devolucion: fechaEstimada || null,
        observaciones_prestamo: observaciones || null,
        estado_documento: requiereDoc ? "Enviado_Pendiente" : "No Aplica",
      })
      .select()
      .single();

    if (prestamoError) {
      setError(prestamoError.message);
      setLoading(false);
      return;
    }

    // Upload document if provided
    if (documentoFile && prestamo) {
      const fileName = `${prestamo.id}/${documentoFile.name}`;
      await supabase.storage
        .from("documentos-legales")
        .upload(fileName, documentoFile);
      await supabase
        .from("prestamos")
        .update({
          archivo_documento_url: fileName,
          estado_documento: "Diligenciado",
        })
        .eq("id", prestamo.id);
    }

    onSaved();
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedActivo !== null;
      case 2: return selectedRTO !== null;
      case 3: return personaNombre && personaCelular && personaCiudad;
      default: return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Nuevo Préstamo</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 text-sm">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= s ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Activo</span>
            <span>RTO</span>
            <span>Receptor</span>
            <span>Documento</span>
          </div>
        </div>

        <div className="p-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Select Asset */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Seleccionar Activo Disponible</h3>
              <input
                type="text"
                placeholder="Buscar por código o producto..."
                value={searchActivo}
                onChange={(e) => setSearchActivo(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
              />
              <div className="max-h-60 overflow-auto space-y-2">
                {filteredActivos.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedActivo(a)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedActivo?.id === a.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-mono text-sm font-medium">{a.id_codigo}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.producto?.nombre} — {a.producto?.marca_modelo}
                    </p>
                  </div>
                ))}
                {filteredActivos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay activos disponibles
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select RTO */}
          {step === 2 && (
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Seleccionar RTO</h3>
              <div className="max-h-60 overflow-auto space-y-2">
                {rtos.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRTO(r)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRTO?.id === r.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-sm">{r.nombre}</p>
                    <p className="text-xs text-muted-foreground">{r.ciudad_sede}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Receiver Info */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Información del Receptor</h3>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={personaNombre}
                  onChange={(e) => setPersonaNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  placeholder="Nombre del responsable"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Fecha Estimada de Devolución (opcional)
                </label>
                <input
                  type="date"
                  value={fechaEstimada}
                  onChange={(e) => setFechaEstimada(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm resize-none"
                  placeholder="Acuerdos, notas de entrega..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Document Upload */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Documento Legal</h3>
              {selectedActivo?.producto?.requiere_documento_legal ? (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Este producto requiere documento legal. El préstamo quedará como{" "}
                      <strong>Acta Pendiente</strong> hasta que se cargue el archivo.
                    </p>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastrá el archivo o hacé clic para seleccionar
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg"
                      onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="doc-upload"
                    />
                    <label
                      htmlFor="doc-upload"
                      className="cursor-pointer text-primary hover:underline text-sm"
                    >
                      Seleccionar archivo
                    </label>
                    {documentoFile && (
                      <p className="text-sm text-green-600 mt-2">{documentoFile.name}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 border border-border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Este producto no requiere documento legal. El préstamo se creará directamente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 p-5 border-t border-border">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Préstamo"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
