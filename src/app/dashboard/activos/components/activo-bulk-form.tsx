"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Package, Loader2, CheckCircle } from "lucide-react";
import type { ProductoModelo } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export function ActivoBulkForm({ onClose, onSaved }: Props) {
  const [productos, setProductos] = useState<ProductoModelo[]>([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(0);
  const [done, setDone] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchProductos = async () => {
      const { data } = await supabase.from("productos_modelo").select("*").order("nombre");
      setProductos((data || []) as ProductoModelo[]);
    };
    fetchProductos();
  }, []);

  const handleBulkCreate = async () => {
    if (!productoId || cantidad < 1) {
      setError("Seleccioná un producto y una cantidad válida");
      return;
    }

    setLoading(true);
    setError(null);
    setCreated(0);

    // Create assets one by one (Supabase will auto-generate codes via trigger)
    for (let i = 0; i < cantidad; i++) {
      const { error: insertError } = await supabase.from("activos_fisicos").insert({
        producto_id: productoId,
        observaciones: observaciones || null,
        estado_actual: "En Bodega",
      });

      if (insertError) {
        setError(`Error al crear activo ${i + 1}: ${insertError.message}`);
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
              Se crearon <strong>{created}</strong> activos correctamente.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Los códigos TRANS-CO-xxxxx se asignaron automáticamente.
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
      <div className="bg-white rounded-xl border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Crear Activos en Lote</h2>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Los códigos <strong>TRANS-CO-xxxxx</strong> se generan automáticamente en orden secuencial.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Producto *</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
            >
              <option value="">Seleccionar producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.marca_modelo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Cantidad *</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={100}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Máximo 100 por lote</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Observaciones (opcional)</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm"
              placeholder="Se aplicará a todos los activos del lote"
            />
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <div className="text-sm">
                <span className="font-medium">Creando activos...</span>
                <span className="text-muted-foreground ml-1">{created} de {cantidad}</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(created / cantidad) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkCreate}
              disabled={loading || !productoId || cantidad < 1}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creando..." : `Crear ${cantidad} Activos`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
