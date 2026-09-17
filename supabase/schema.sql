-- ============================================
-- SISTEMA DE GESTIÓN DE INVENTARIO Y PRÉSTAMOS
-- Schema para Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA: usuarios (extiende auth.users de Supabase)
-- ============================================
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('admin', 'operador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. TABLA: productos_modelo (Catálogo general)
-- ============================================
CREATE TABLE public.productos_modelo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  marca_modelo TEXT NOT NULL,
  contenido TEXT, -- Descripción de accesorios/kit
  requiere_documento_legal BOOLEAN NOT NULL DEFAULT false,
  stock_minimo_alerta INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. TABLA: activos_fisicos (Unidades individuales)
-- ============================================
CREATE TABLE public.activos_fisicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_codigo TEXT NOT NULL UNIQUE, -- Formato: TRANS-CO-xxxxx
  producto_id UUID NOT NULL REFERENCES public.productos_modelo(id) ON DELETE RESTRICT,
  estado_actual TEXT NOT NULL DEFAULT 'En Bodega' CHECK (estado_actual IN ('En Bodega', 'En Préstamo', 'En Mantenimiento')),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. TABLA: rto (Remote Translation Offices)
-- ============================================
CREATE TABLE public.rto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  ciudad_sede TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Inhabilitada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. TABLA: prestamos (Transacciones e Historial)
-- ============================================
CREATE TABLE public.prestamos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activo_id UUID NOT NULL REFERENCES public.activos_fisicos(id) ON DELETE RESTRICT,
  rto_id UUID NOT NULL REFERENCES public.rto(id) ON DELETE RESTRICT,
  persona_nombre TEXT NOT NULL,
  persona_celular TEXT NOT NULL,
  persona_ciudad TEXT NOT NULL,
  fecha_prestamo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_estimada_devolucion DATE,
  fecha_devolucion_real TIMESTAMPTZ,
  estado_documento TEXT NOT NULL DEFAULT 'No Aplica' CHECK (estado_documento IN ('No Aplica', 'Enviado_Pendiente', 'Diligenciado')),
  archivo_documento_url TEXT,
  observaciones_prestamo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para performance
-- ============================================
CREATE INDEX idx_activos_producto ON public.activos_fisicos(producto_id);
CREATE INDEX idx_activos_estado ON public.activos_fisicos(estado_actual);
CREATE INDEX idx_activos_codigo ON public.activos_fisicos(id_codigo);
CREATE INDEX idx_prestamos_activo ON public.prestamos(activo_id);
CREATE INDEX idx_prestamos_rto ON public.prestamos(rto_id);
CREATE INDEX idx_prestamos_estado ON public.prestamos(fecha_devolucion_real);

-- ============================================
-- FUNCIÓN: Generar código secuencial TRANS-CO-xxxxx
-- ============================================
CREATE OR REPLACE FUNCTION public.generar_codigo_activo()
RETURNS TRIGGER AS $$
DECLARE
  siguiente_numero INTEGER;
  nuevo_codigo TEXT;
BEGIN
  -- Obtener el siguiente número secuencial
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(id_codigo FROM 11 FOR 5) AS INTEGER)
  ), 0) + 1
  INTO siguiente_numero
  FROM public.activos_fisicos;
  
  -- Formatear con ceros a la izquierda
  nuevo_codigo := 'TRANS-CO-' || LPAD(siguiente_numero::TEXT, 5, '0');
  
  NEW.id_codigo := nuevo_codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar código
CREATE TRIGGER trigger_generar_codigo
  BEFORE INSERT ON public.activos_fisicos
  FOR EACH ROW
  WHEN (NEW.id_codigo IS NULL OR NEW.id_codigo = '')
  EXECUTE FUNCTION public.generar_codigo_activo();

-- ============================================
-- FUNCIÓN: Actualizar estado del activo al prestar/devolver
-- ============================================
CREATE OR REPLACE FUNCTION public.actualizar_estado_activo_prestamo()
RETURNS TRIGGER AS $$
BEGIN
  -- Al crear préstamo: activo -> "En Préstamo"
  IF TG_OP = 'INSERT' THEN
    UPDATE public.activos_fisicos
    SET estado_actual = 'En Préstamo',
        updated_at = NOW()
    WHERE id = NEW.activo_id;
  END IF;
  
  -- Al devolver (fecha_devolucion_real不再是 NULL): activo -> "En Bodega"
  IF TG_OP = 'UPDATE' AND OLD.fecha_devolucion_real IS NULL AND NEW.fecha_devolucion_real IS NOT NULL THEN
    UPDATE public.activos_fisicos
    SET estado_actual = 'En Bodega',
        updated_at = NOW()
    WHERE id = NEW.activo_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_estado_prestamo
  AFTER INSERT OR UPDATE ON public.prestamos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_estado_activo_prestamo();

-- ============================================
-- RLS (Row Level Security) - Habilitar
-- ============================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_fisicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS (usuarios autenticados ven todo)
-- ============================================

-- Usuarios: solo ven su propio perfil + admins ven todo
CREATE POLICY "Usuarios ven su perfil" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins ven todos los usuarios" ON public.usuarios
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Productos: todos los autenticados pueden leer, solo admin puede modificar
CREATE POLICY "Todos leen productos" ON public.productos_modelo
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin gestiona productos" ON public.productos_modelo
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Activos: todos los autenticados pueden leer, solo admin puede modificar
CREATE POLICY "Todos leen activos" ON public.activos_fisicos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin gestiona activos" ON public.activos_fisicos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- RTOs: todos los autenticados pueden leer, solo admin puede modificar
CREATE POLICY "Todos leen RTOs" ON public.rto
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin gestiona RTOs" ON public.rto
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Préstamos: todos los autenticados pueden leer, admin puede todo
CREATE POLICY "Todos leen prestamos" ON public.prestamos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin gestiona prestamos" ON public.prestamos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- ============================================
-- STORAGE: Bucket para documentos legales
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-legales', 'documentos-legales', false);

-- Policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos-legales' AND auth.role() = 'authenticated');

-- Policy: authenticated users can view documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos-legales' AND auth.role() = 'authenticated');
