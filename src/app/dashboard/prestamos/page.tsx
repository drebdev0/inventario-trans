"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Handshake, RotateCcw, Trash2, Pencil, Layers } from "lucide-react";
import type { Prestamo, ActivoFisico, RTO } from "@/lib/types";
import { PrestamoForm } from "./components/prestamo-form";
import { PrestamoBulkForm } from "./components/prestamo-bulk-form";
import { PrestamoEditForm } from "./components/prestamo-edit-form";
import { DevolverForm } from "./components/devolver-form";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<(Prestamo & { activo?: ActivoFisico; rto?: RTO })[]>([]);
  const [rtos, setRTOs] = useState<RTO[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editLoan, setEditLoan] = useState<(Prestamo & { activo?: ActivoFisico; rto?: RTO }) | null>(null);
  const [returningLoan, setReturningLoan] = useState<(Prestamo & { activo?: ActivoFisico }) | null>(null);
  const [deleteLoan, setDeleteLoan] = useState<(Prestamo & { activo?: ActivoFisico }) | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const [prestamosRes, rtosRes] = await Promise.all([
      supabase
        .from("prestamos")
        .select("*, activo:activos_fisicos(*, producto:productos_modelo(*)), rto:rto(*)")
        .is("fecha_devolucion_real", null)
        .order("fecha_prestamo", { ascending: false }),
      supabase.from("rto").select("*").eq("estado", "Activa"),
    ]);
    setPrestamos((prestamosRes.data || []) as (Prestamo & { activo?: ActivoFisico; rto?: RTO })[]);
    setRTOs((rtosRes.data || []) as RTO[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!deleteLoan) return;
    setDeleting(true);
    await supabase.from("activos_fisicos").update({ estado_actual: "En Bodega" }).eq("id", deleteLoan.activo_id);
    await supabase.from("prestamos").delete().eq("id", deleteLoan.id);
    setDeleting(false);
    setDeleteLoan(null);
    fetchData();
  };

  const filtered = prestamos.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.activo?.id_codigo.toLowerCase().includes(searchLower) ||
      p.persona_nombre.toLowerCase().includes(searchLower) ||
      p.rto?.nombre.toLowerCase().includes(searchLower)
    );
  });

  const docStatusColor = (status: string) => {
    switch (status) {
      case "Diligenciado": return "bg-green-100 text-green-800";
      case "Enviado_Pendiente": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const docStatusLabel = (status: string) => {
    switch (status) {
      case "Diligenciado": return "Acta Cargada";
      case "Enviado_Pendiente": return "Acta Pendiente";
      default: return "No Aplica";
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
          <h1 className="text-2xl font-bold text-foreground">Préstamos Activos</h1>
          <p className="text-muted-foreground">Equipos actualmente prestados a RTOs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkForm(true)}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity border border-border"
          >
            <Layers className="w-4 h-4" />
            Préstamo en Lote
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nuevo Préstamo
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por código, persona o RTO..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay préstamos activos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Producto</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">RTO</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Responsable</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Ciudad</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Fecha Préstamo</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Doc.</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono text-xs font-medium">{p.activo?.id_codigo}</td>
                    <td className="py-3 px-3">{p.activo?.producto?.nombre || "N/A"}</td>
                    <td className="py-3 px-3">{p.rto?.nombre || "N/A"}</td>
                    <td className="py-3 px-3">{p.persona_nombre}</td>
                    <td className="py-3 px-3">{p.persona_ciudad}</td>
                    <td className="py-3 px-3">{new Date(p.fecha_prestamo).toLocaleDateString("es-CO")}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${docStatusColor(p.estado_documento)}`}>
                        {docStatusLabel(p.estado_documento)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditLoan(p)}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReturningLoan(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Devolver
                        </button>
                        <button
                          onClick={() => setDeleteLoan(p)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded transition-colors"
                          title="Eliminar préstamo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
        <PrestamoForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchData(); }} />
      )}
      {showBulkForm && (
        <PrestamoBulkForm onClose={() => setShowBulkForm(false)} onSaved={() => { setShowBulkForm(false); fetchData(); }} />
      )}
      {editLoan && (
        <PrestamoEditForm prestamo={editLoan} rtos={rtos} onClose={() => setEditLoan(null)} onSaved={() => { setEditLoan(null); fetchData(); }} />
      )}
      {returningLoan && (
        <DevolverForm prestamo={returningLoan} onClose={() => setReturningLoan(null)} onSaved={() => { setReturningLoan(null); fetchData(); }} />
      )}
      {deleteLoan && (
        <ConfirmDialog
          title="Eliminar Préstamo"
          message={`¿Eliminar el préstamo de ${deleteLoan.persona_nombre} (${deleteLoan.activo?.id_codigo})? El activo volverá a bodega.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteLoan(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
