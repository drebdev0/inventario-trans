"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Building2, ToggleLeft, ToggleRight, Trash2, Pencil } from "lucide-react";
import type { RTO, Prestamo, ActivoFisico } from "@/lib/types";
import { RTOForm } from "./components/rto-form";
import { RTODetail } from "./components/rto-detail";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function RTOPage() {
  const [rtos, setRTOs] = useState<RTO[]>([]);
  const [prestamos, setPrestamos] = useState<(Prestamo & { activo?: ActivoFisico })[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRTO, setEditRTO] = useState<RTO | null>(null);
  const [selectedRTO, setSelectedRTO] = useState<RTO | null>(null);
  const [deleteRTO, setDeleteRTO] = useState<RTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    const [rtosRes, prestamosRes] = await Promise.all([
      supabase.from("rto").select("*").order("created_at", { ascending: false }),
      supabase.from("prestamos").select("*, activo:activos_fisicos(*)").is("fecha_devolucion_real", null),
    ]);
    setRTOs((rtosRes.data || []) as RTO[]);
    setPrestamos((prestamosRes.data || []) as (Prestamo & { activo?: ActivoFisico })[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleEstado = async (rto: RTO) => {
    setTogglingId(rto.id);
    const newStatus = rto.estado === "Activa" ? "Inhabilitada" : "Activa";
    await supabase.from("rto").update({ estado: newStatus }).eq("id", rto.id);
    await fetchData();
    setTogglingId(null);
  };

  const handleDelete = async () => {
    if (!deleteRTO) return;
    setDeleting(true);
    await supabase.from("rto").delete().eq("id", deleteRTO.id);
    setDeleting(false);
    setDeleteRTO(null);
    fetchData();
  };

  const getActiveLoansCount = (rtoId: string) => {
    return prestamos.filter((p) => p.rto_id === rtoId).length;
  };

  const filtered = rtos.filter(
    (r) =>
      r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      r.ciudad_sede.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-foreground">RTOs</h1>
          <p className="text-muted-foreground">Oficinas de Traducción Remotas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nueva RTO
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
        />
      </div>

      {/* RTOs Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontraron RTOs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rto) => (
            <div
              key={rto.id}
              className="bg-white rounded-xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow relative group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3" onClick={() => setSelectedRTO(rto)}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{rto.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{rto.ciudad_sede}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleEstado(rto); }}
                    disabled={togglingId === rto.id}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title={rto.estado === "Activa" ? "Inhabilitar" : "Activar"}
                  >
                    {rto.estado === "Activa" ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditRTO(rto); }}
                    className="p-1 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Editar RTO"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteRTO(rto); }}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar RTO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={() => setSelectedRTO(rto)}>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rto.estado === "Activa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {rto.estado}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getActiveLoansCount(rto.id)} préstamos activos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editRTO) && (
        <RTOForm
          rto={editRTO}
          onClose={() => { setShowForm(false); setEditRTO(null); }}
          onSaved={() => { setShowForm(false); setEditRTO(null); fetchData(); }}
        />
      )}

      {selectedRTO && (
        <RTODetail
          rto={selectedRTO}
          prestamos={prestamos.filter((p) => p.rto_id === selectedRTO.id)}
          onClose={() => setSelectedRTO(null)}
          onRefresh={fetchData}
        />
      )}

      {deleteRTO && (
        <ConfirmDialog
          title="Eliminar RTO"
          message={`¿Eliminar "${deleteRTO.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRTO(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
