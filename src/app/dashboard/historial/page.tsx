"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Clock, Download } from "lucide-react";
import type { Prestamo, ActivoFisico, ProductoModelo, RTO } from "@/lib/types";

export default function HistorialPage() {
  const [prestamos, setPrestamos] = useState<(Prestamo & { activo?: ActivoFisico; rto?: RTO })[]>([]);
  const [search, setSearch] = useState("");
  const [filterRTO, setFilterRTO] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [rtos, setRTOs] = useState<RTO[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [prestamosRes, rtosRes] = await Promise.all([
        supabase
          .from("prestamos")
          .select("*, activo:activos_fisicos(*, producto:productos_modelo(*)), rto:rto(*)")
          .order("fecha_prestamo", { ascending: false }),
        supabase.from("rto").select("*"),
      ]);
      setPrestamos((prestamosRes.data || []) as (Prestamo & { activo?: ActivoFisico; rto?: RTO })[]);
      setRTOs((rtosRes.data || []) as RTO[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = prestamos.filter((p) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      p.activo?.id_codigo.toLowerCase().includes(searchLower) ||
      p.persona_nombre.toLowerCase().includes(searchLower) ||
      p.activo?.producto?.nombre.toLowerCase().includes(searchLower);

    const matchesRTO = !filterRTO || p.rto_id === filterRTO;

    const loanDate = new Date(p.fecha_prestamo);
    const matchesDateFrom = !filterDateFrom || loanDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || loanDate <= new Date(filterDateTo);

    return matchesSearch && matchesRTO && matchesDateFrom && matchesDateTo;
  });

  const isReturned = (p: Prestamo) => p.fecha_devolucion_real !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Historial de Préstamos</h1>
        <p className="text-muted-foreground">Registro completo de préstamos pasados y activos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, persona o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
          />
        </div>
        <select
          value={filterRTO}
          onChange={(e) => setFilterRTO(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
        >
          <option value="">Todas las RTOs</option>
          {rtos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
          placeholder="Desde"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white text-sm"
          placeholder="Hasta"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron registros</p>
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
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Préstamo</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Devolución</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Estado</th>
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
                      {p.fecha_devolucion_real
                        ? new Date(p.fecha_devolucion_real).toLocaleDateString("es-CO")
                        : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isReturned(p) ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isReturned(p) ? "Devuelto" : "Activo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filtered.length} de {prestamos.length} registros
      </div>
    </div>
  );
}
