export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  rol: "admin" | "operador";
  created_at: string;
  updated_at: string;
}

export interface ProductoModelo {
  id: string;
  nombre: string;
  marca_modelo: string;
  contenido: string | null;
  requiere_documento_legal: boolean;
  stock_minimo_alerta: number;
  created_at: string;
  updated_at: string;
}

export interface ActivoFisico {
  id: string;
  id_codigo: string;
  producto_id: string;
  estado_actual: "En Bodega" | "En Préstamo" | "En Mantenimiento";
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  producto?: ProductoModelo;
}

export interface RTO {
  id: string;
  nombre: string;
  ciudad_sede: string;
  estado: "Activa" | "Inhabilitada";
  created_at: string;
  updated_at: string;
}

export interface Prestamo {
  id: string;
  activo_id: string;
  rto_id: string;
  persona_nombre: string;
  persona_celular: string;
  persona_ciudad: string;
  fecha_prestamo: string;
  fecha_estimada_devolucion: string | null;
  fecha_devolucion_real: string | null;
  estado_documento: "No Aplica" | "Enviado_Pendiente" | "Diligenciado";
  archivo_documento_url: string | null;
  observaciones_prestamo: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  activo?: ActivoFisico;
  rto?: RTO;
}

export type EstadoActivo = "En Bodega" | "En Préstamo" | "En Mantenimiento";
export type EstadoRTO = "Activa" | "Inhabilitada";
export type EstadoDocumento = "No Aplica" | "Enviado_Pendiente" | "Diligenciado";
