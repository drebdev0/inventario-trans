"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import type { ProductoModelo } from "@/lib/types";

interface Props {
  producto?: ProductoModelo | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductoForm({ producto, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(producto?.nombre || "");
  const [marcaModelo, setMarcaModelo] = useState(producto?.marca_modelo || "");
  const [contenido, setContenido] = useState(producto?.contenido || "");
  const [requiereDocumento, setRequiereDocumento] = useState(producto?.requiere_documento_legal || false);
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo_alerta || 3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = {
      nombre,
      marca_modelo: marcaModelo,
      contenido: contenido || null,
      requiere_documento_legal: requiereDocumento,
      stock_minimo_alerta: stockMinimo,
    };

    let result;
    if (producto) {
      result = await supabase.from("productos_modelo").update(data).eq("id", producto.id);
    } else {
      result = await supabase.from("productos_modelo").insert(data);
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">
            {producto ? "Editar Producto" : "Nuevo Producto"}
          </h2>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="ej. Micrófono USB"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Marca y Modelo *</label>
            <input
              type="text"
              value={marcaModelo}
              onChange={(e) => setMarcaModelo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="ej. Audio-Technica AT2040"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Contenido / Kit</label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              placeholder="ej. Cable USB, estuche, adaptador XLR"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Stock Mínimo de Alerta</label>
            <input
              type="number"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiere_doc"
              checked={requiereDocumento}
              onChange={(e) => setRequiereDocumento(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
            />
            <label htmlFor="requiere_doc" className="text-sm text-foreground">
              Requiere documento legal
            </label>
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
              {loading ? "Guardando..." : producto ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
