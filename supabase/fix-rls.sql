-- ============================================
-- CORRECCIÓN: Políticas RLS sin recursión
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Primero eliminar las políticas problemáticas
DROP POLICY IF EXISTS "Usuarios ven su perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins ven todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Todos leen productos" ON public.productos_modelo;
DROP POLICY IF EXISTS "Admin gestiona productos" ON public.productos_modelo;
DROP POLICY IF EXISTS "Todos leen activos" ON public.activos_fisicos;
DROP POLICY IF EXISTS "Admin gestiona activos" ON public.activos_fisicos;
DROP POLICY IF EXISTS "Todos leen RTOs" ON public.rto;
DROP POLICY IF EXISTS "Admin gestiona RTOs" ON public.rto;
DROP POLICY IF EXISTS "Todos leen prestamos" ON public.prestamos;
DROP POLICY IF EXISTS "Admin gestiona prestamos" ON public.prestamos;

-- ============================================
-- POLÍTICAS CORREGIDAS (sin recursión)
-- ============================================

-- Usuarios: cada uno ve su propio perfil
CREATE POLICY "Usuarios ven su perfil" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

-- Usuarios: pueden insertar su propio perfil (para el trigger)
CREATE POLICY "Usuarios crean su perfil" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Productos: todos los autenticados leen, autenticados pueden crear/modificar
CREATE POLICY "Productos read" ON public.productos_modelo
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Productos insert" ON public.productos_modelo
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Productos update" ON public.productos_modelo
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Productos delete" ON public.productos_modelo
  FOR DELETE USING (auth.role() = 'authenticated');

-- Activos: todos los autenticados leen, autenticados pueden crear/modificar
CREATE POLICY "Activos read" ON public.activos_fisicos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Activos insert" ON public.activos_fisicos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Activos update" ON public.activos_fisicos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Activos delete" ON public.activos_fisicos
  FOR DELETE USING (auth.role() = 'authenticated');

-- RTOs: todos los autenticados leen, autenticados pueden crear/modificar
CREATE POLICY "RTOs read" ON public.rto
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "RTOs insert" ON public.rto
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "RTOs update" ON public.rto
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "RTOs delete" ON public.rto
  FOR DELETE USING (auth.role() = 'authenticated');

-- Préstamos: todos los autenticados leen, autenticados pueden crear/modificar
CREATE POLICY "Prestamos read" ON public.prestamos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Prestamos insert" ON public.prestamos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Prestamos update" ON public.prestamos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Prestamos delete" ON public.prestamos
  FOR DELETE USING (auth.role() = 'authenticated');
