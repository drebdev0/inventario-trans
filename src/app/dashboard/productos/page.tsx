"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Package } from "lucide-react";
import type { ProductoModelo, ActivoFisico } from "@/lib/types";
import { ProductoCard } from "./components/producto-card";
import { ProductoForm } from "./components/producto-form";
import { ProductoDetail } from "./components/producto-detail";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoModelo[]>([]);
  const [activos, setActivos] = useState<ActivoFisico[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "stock_bajo" | "mantenimiento">("todos");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductoModelo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductoModelo | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<ProductoModelo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const [productosRes, activosRes] = await Promise.all([
      supabase.from("productos_modelo").select("*").order("created_at", { ascending: false }),
      supabase.from("activos_fisicos").select("*"),
    ]);
    setProductos((productosRes.data || []) as ProductoModelo[]);
    setActivos((activosRes.data || []) as ActivoFisico[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    await supabase.from("productos_modelo").delete().eq("id", deleteProduct.id);
    setDeleting(false);
    setDeleteProduct(null);
    fetchData();
  };

  const getStockInfo = (productoId: string) => {
    const activosProducto = activos.filter((a) => a.producto_id === productoId);
    return {
      disponibles: activosProducto.filter((a) => a.estado_actual === "En Bodega").length,
      prestados: activosProducto.filter((a) => a.estado_actual === "En Préstamo").length,
      mantenimiento: activosProducto.filter((a) => a.estado_actual === "En Mantenimiento").length,
    };
  };

  const filteredProductos = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.marca_modelo.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "stock_bajo") {
      const stock = getStockInfo(p.id);
      return stock.disponibles <= p.stock_minimo_alerta;
    }
    if (filter === "mantenimiento") {
      const stock = getStockInfo(p.id);
      return stock.mantenimiento > 0;
    }
    return true;
  });

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
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground">Catálogo de productos y modelos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "stock_bajo", "mantenimiento"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {f === "todos" ? "Todos" : f === "stock_bajo" ? "Stock Bajo" : "Mantenimiento"}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProductos.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProductos.map((producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              stock={getStockInfo(producto.id)}
              onClick={() => setSelectedProduct(producto)}
              onEdit={() => setEditProduct(producto)}
              onDelete={() => setDeleteProduct(producto)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {(showForm || editProduct) && (
        <ProductoForm
          producto={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={() => { setShowForm(false); setEditProduct(null); fetchData(); }}
        />
      )}

      {/* Detail Modal */}
      {selectedProduct && (
        <ProductoDetail
          producto={selectedProduct}
          activos={activos.filter((a) => a.producto_id === selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onRefresh={fetchData}
        />
      )}

      {/* Delete Confirm */}
      {deleteProduct && (
        <ConfirmDialog
          title="Eliminar Producto"
          message={`¿Eliminar "${deleteProduct.nombre}"? Se eliminarán también todos sus activos asociados. Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeleteProduct(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
