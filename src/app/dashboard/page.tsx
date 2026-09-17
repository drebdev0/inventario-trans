"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, Cpu, Handshake, AlertTriangle } from "lucide-react";
import type { ProductoModelo, ActivoFisico, Prestamo } from "@/lib/types";

interface Stats {
  totalProductos: number;
  totalActivos: number;
  activosDisponibles: number;
  prestamosActivos: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProductos: 0,
    totalActivos: 0,
    activosDisponibles: 0,
    prestamosActivos: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<(ProductoModelo & { disponibles: number })[]>([]);
  const [recentLoans, setRecentLoans] = useState<(Prestamo & { activo?: ActivoFisico })[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [productosRes, activosRes, prestamosRes] = await Promise.all([
          supabase.from("productos_modelo").select("*"),
          supabase.from("activos_fisicos").select("*, producto:productos_modelo(*)"),
          supabase.from("prestamos").select("*, activo:activos_fisicos(*, producto:productos_modelo(*))").is("fecha_devolucion_real", null),
        ]);

        const productos = (productosRes.data || []) as ProductoModelo[];
        const activos = (activosRes.data || []) as ActivoFisico[];
        const prestamosActivos = (prestamosRes.data || []) as Prestamo[];

        // Calculate stats
        const activosDisponibles = activos.filter((a) => a.estado_actual === "En Bodega").length;

        setStats({
          totalProductos: productos.length,
          totalActivos: activos.length,
          activosDisponibles,
          prestamosActivos: prestamosActivos.length,
        });

        // Calculate low stock products
        const lowStock = productos
          .map((p) => {
            const disponibles = activos.filter(
              (a) => a.producto_id === p.id && a.estado_actual === "En Bodega"
            ).length;
            return { ...p, disponibles };
          })
          .filter((p) => p.disponibles <= p.stock_minimo_alerta);

        setLowStockProducts(lowStock);

        // Recent loans (last 5)
        setRecentLoans(prestamosActivos.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Productos", value: stats.totalProductos, icon: Package, color: "bg-blue-500" },
    { label: "Total Activos", value: stats.totalActivos, icon: Cpu, color: "bg-purple-500" },
    { label: "Disponibles en Bodega", value: stats.activosDisponibles, icon: Package, color: "bg-green-500" },
    { label: "Préstamos Activos", value: stats.prestamosActivos, icon: Handshake, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del inventario y préstamos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Alertas de Stock Bajo</h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <div>
                  <p className="font-medium text-foreground">{product.nombre}</p>
                  <p className="text-sm text-muted-foreground">{product.marca_modelo}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                    {product.disponibles} disponibles / {product.stock_minimo_alerta} mínimo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Loans */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Préstamos Recientes</h2>
        {recentLoans.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay préstamos activos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Código</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Responsable</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Ciudad</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Fecha Préstamo</th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2 font-mono text-xs">{loan.activo?.id_codigo || "N/A"}</td>
                    <td className="py-3 px-2">{loan.persona_nombre}</td>
                    <td className="py-3 px-2">{loan.persona_ciudad}</td>
                    <td className="py-3 px-2">{new Date(loan.fecha_prestamo).toLocaleDateString("es-CO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
