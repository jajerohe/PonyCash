"use client";

import { useState } from "react";
import { Formulario } from "@/components/formulario";
import { claseEncabezadoFijo } from "@/components/listado";
import { CampoCantidad, sumarCantidades } from "@/components/cantidades";
import type { Estado } from "@/lib/errores";

type Producto = { id: number; nombre: string; tiene: number; bodega: number };

export function FormularioEntrega({
  productos,
  accion,
}: {
  productos: Producto[];
  accion: (estado: Estado, datos: FormData) => Promise<Estado>;
}) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const tiene = productos.reduce((a, p) => a + p.tiene, 0);
  const agrega = sumarCantidades(cantidades);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Formulario accion={accion} textoBoton="Registrar entrega">
        <div className="max-h-[calc(100dvh-22rem)] min-h-48 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">En bodega</th>
                <th className="px-4 py-3 text-right font-medium">Tiene el punto</th>
                <th className="w-36 px-4 py-3 text-right font-medium">Agregar</th>
                <th className="px-4 py-3 text-right font-medium">Quedará con</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => {
                const n = cantidades[p.id] ?? 0;
                const pasa = n > p.bodega;
                return (
                  <tr key={p.id} className={p.bodega === 0 ? "text-slate-400" : ""}>
                    <td className="px-4 py-2 font-semibold">{p.nombre}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${p.bodega === 0 || pasa ? "text-red-600" : ""}`}>{p.bodega}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.tiene}</td>
                    <td className="px-4 py-1.5">
                      {p.bodega === 0 ? (
                        <span className="block px-2 py-1 text-right text-xs">sin existencia</span>
                      ) : (
                        <CampoCantidad
                          name={`cantidad-${p.id}`}
                          etiqueta={`Agregar ${p.nombre}`}
                          max={p.bodega}
                          onCambio={(c) => setCantidades((v) => ({ ...v, [p.id]: c ?? 0 }))}
                        />
                      )}
                    </td>
                    <td className={`px-4 py-2 text-right font-bold tabular-nums ${n ? "text-sky-700" : ""}`}>{p.tiene + n}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-600">
          El punto tiene <b>{tiene}</b> · se agregan <b className="text-sky-700">{agrega}</b> · quedará con <b>{tiene + agrega}</b> manillas.
        </p>
      </Formulario>
    </section>
  );
}
