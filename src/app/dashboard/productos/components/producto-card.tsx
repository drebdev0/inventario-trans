"use client";

import { AlertTriangle, Package, Trash2, Pencil } from "lucide-react";
import type { ProductoModelo } from "@/lib/types";

interface StockInfo {
  disponibles: number;
  prestados: number;
  mantenimiento: number;
}

interface Props {
  producto: ProductoModelo;
  stock: StockInfo;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProductoCard({ producto, stock, onClick, onEdit, onDelete }: Props) {
  const isLowStock = stock.disponibles <= producto.stock_minimo_alerta;

  return (
    <div className="bg-white rounded-xl border border-border p-5 cursor-pointer hover:shadow-md transition-shadow relative group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3" onClick={onClick}>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{producto.nombre}</h3>
            <p className="text-sm text-muted-foreground">{producto.marca_modelo}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isLowStock && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3" />
              Stock Bajo
            </span>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Editar producto"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar producto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {producto.contenido && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" onClick={onClick}>{producto.contenido}</p>
      )}

      <div className="flex gap-2 flex-wrap" onClick={onClick}>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {stock.disponibles} Disponibles
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {stock.prestados} Prestados
        </span>
        {stock.mantenimiento > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {stock.mantenimiento} Mantenimiento
          </span>
        )}
      </div>
    </div>
  );
}
