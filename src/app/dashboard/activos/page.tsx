"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Cpu, ArrowRightLeft, Wrench, Trash2, Pencil, Layers } from "lucide-react";
import type { ActivoFisico, ProductoModelo } from "@/lib/types";
import { ActivoForm } from "./components/activo-form";
import { ActivoBulkForm } from "./components/activo-bulk-form";
import { ActivoEditForm } from "./components/activo-edit-form";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function ActivosPage() {
  const [activos, setActivos] = useState<(ActivoFisico & { producto?: ProductoModelo })[]>([]);
  const [productos, setProductos] = useState<ProductoModelo[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editActivo, setEditActivo] = useState<(ActivoFisico & { producto?: ProductoModelo }) | null>(null);
  const [deleteActivo, setDeleteActivo] = useState<(ActivoFisico & { producto?: ProductoModelo }) | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    const [activosRes, productosRes] = await Promise.all([
      supabase.from("activos_fisicos").select("*, producto:productos_modelo(*)").order("created_at", { ascending: false }),
      supabase.from("productos_modelo").select("*"),
    ]);
    setActivos((activosRes.data || []) as (ActivoFisico & { producto?: ProductoModelo })[]);
    setProductos((productosRes.data || []) as ProductoModelo[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (activoId: string, newStatus: string) => {
    setUpdatingId(activoId);
    await supabase.from("activos_fisicos").update({ estado_actual: newStatus }).eq("id", activoId);
    await fetchData();
    setUpdatingId(null);
  };

  const handleDelete = async () => {
    if (!deleteActivo) return;
    setDeleting(true);
    await supabase.from("activos_fisicos").delete().eq("id", deleteActivo.id);
    setDeleting(false);
    setDeleteActivo(null);
    fetchData();
  };

  const filtered = activos.filter((a) => {
    const matchesSearch =
      a.id_codigo.toLowerCase().includes(search.toLowerCase()) ||
      a.producto?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.producto?.marca_modelo.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter !== "todos" && a.estado_actual !== filter) return false;
    return true;
  });

  const statusColor = (estado: string) => {
    switch (estado) {
      case "En Bodega": return "bg-green-100 text-green-800";
      case "En Préstamo": return "bg-blue-100 text-blue-800";
      case "En Mantenimiento": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activos Físicos</h1>
          <p className="text-muted-foreground">Inventario individual de activos (TRANS-CO-xxxxx)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkForm(true)}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity border border-border"
          >
            <Layers className="w-4 h-4" />
            Crear en Lote
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nuevo Activo
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "En Bodega", "En Préstamo", "En Mantenimiento"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {f === "todos" ? "Todos" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron activos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Código</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Producto</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Observaciones</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((activo) => (
                  <tr key={activo.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs font-medium">{activo.id_codigo}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{activo.producto?.nombre || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{activo.producto?.marca_modelo}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(activo.estado_actual)}`}>
                        {activo.estado_actual}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                      {activo.observaciones || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditActivo(activo)}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {activo.estado_actual === "En Bodega" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(activo.id, "En Mantenimiento")}
                              disabled={updatingId === activo.id}
                              className="p-1.5 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Enviar a mantenimiento"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteActivo(activo)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {activo.estado_actual === "En Mantenimiento" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(activo.id, "En Bodega")}
                              disabled={updatingId === activo.id}
                              className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Devolver a bodega"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteActivo(activo)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ActivoForm productos={productos} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}
      {showBulkForm && (
        <ActivoBulkForm onClose={() => setShowBulkForm(false)} onSaved={() => { setShowBulkForm(false); fetchData(); }} />
      )}
      {editActivo && (
        <ActivoEditForm activo={editActivo} productos={productos} onClose={() => setEditActivo(null)} onSaved={() => { setEditActivo(null); fetchData(); }} />
      )}
      {deleteActivo && (
        <ConfirmDialog
          title="Eliminar Activo"
          message={`¿Eliminar el activo ${deleteActivo.id_codigo}? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteActivo(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
