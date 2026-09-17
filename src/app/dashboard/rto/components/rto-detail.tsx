"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Upload, FileCheck } from "lucide-react";
import type { RTO, Prestamo, ActivoFisico } from "@/lib/types";

interface Props {
  rto: RTO;
  prestamos: (Prestamo & { activo?: ActivoFisico })[];
  onClose: () => void;
  onRefresh: () => void;
}

export function RTODetail({ rto, prestamos, onClose, onRefresh }: Props) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const supabase = createClient();

  const handleFileUpload = async (prestamoId: string, file: File) => {
    setUploadingId(prestamoId);
    const fileName = `${prestamoId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documentos-legales")
      .upload(fileName, file);

    if (!uploadError) {
      await supabase
        .from("prestamos")
        .update({
          archivo_documento_url: fileName,
          estado_documento: "Diligenciado",
        })
        .eq("id", prestamoId);
      onRefresh();
    }
    setUploadingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border w-full max-w-3xl max-h-[80vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">{rto.nombre}</h2>
            <p className="text-sm text-muted-foreground">{rto.ciudad_sede}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                rto.estado === "Activa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {rto.estado}
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <h3 className="font-semibold text-foreground mb-3">
            Préstamos Activos ({prestamos.length})
          </h3>

          {prestamos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay préstamos activos para esta RTO
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Código</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Responsable</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Ciudad</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Celular</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamos.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-2 font-mono text-xs">{p.activo?.id_codigo || "N/A"}</td>
                      <td className="py-2 px-2">{p.persona_nombre}</td>
                      <td className="py-2 px-2">{p.persona_ciudad}</td>
                      <td className="py-2 px-2">{p.persona_celular}</td>
                      <td className="py-2 px-2">
                        {p.estado_documento === "Diligenciado" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FileCheck className="w-3 h-3" />
                            Cargado
                          </span>
                        ) : p.estado_documento === "Enviado_Pendiente" ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Pendiente
                            </span>
                            <label className="cursor-pointer text-primary hover:underline text-xs">
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(p.id, file);
                                }}
                              />
                              <Upload className="w-3 h-3 inline" /> Subir
                            </label>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
