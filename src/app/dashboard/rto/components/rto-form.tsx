"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import type { RTO } from "@/lib/types";

interface Props {
  rto?: RTO | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RTOForm({ rto, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(rto?.nombre || "");
  const [ciudadSede, setCiudadSede] = useState(rto?.ciudad_sede || "");
  const [estado, setEstado] = useState<"Activa" | "Inhabilitada">(rto?.estado || "Activa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = { nombre, ciudad_sede: ciudadSede, estado };

    let result;
    if (rto) {
      result = await supabase.from("rto").update(data).eq("id", rto.id);
    } else {
      result = await supabase.from("rto").insert(data);
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
          <h2 className="text-lg font-semibold">{rto ? "Editar RTO" : "Nueva RTO"}</h2>
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
              placeholder="ej. RTO Bogotá"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ciudad Sede *</label>
            <input
              type="text"
              value={ciudadSede}
              onChange={(e) => setCiudadSede(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="ej. Bogotá"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "Activa" | "Inhabilitada")}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
            >
              <option value="Activa">Activa</option>
              <option value="Inhabilitada">Inhabilitada</option>
            </select>
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
              {loading ? "Guardando..." : rto ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
