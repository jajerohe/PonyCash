"use client";

import { useState } from "react";
import { Formulario } from "@/components/formulario";
import { claseEncabezadoFijo } from "@/components/listado";
import { Campo } from "@/components/ui";
import { CampoCantidad, sumarCantidades } from "@/components/cantidades";
import { registrarEntrada } from "../actions";

type Producto = { id: number; nombre: string; existencia: number };

export function FormularioEntrada({ productos, fecha }: { productos: Producto[]; fecha: string }) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const total = sumarCantidades(cantidades);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Formulario
        accion={async (estado, datos) => {
          const resultado = await registrarEntrada(estado, datos);
          if (resultado?.ok) setCantidades({});
          return resultado;
        }}
        textoBoton="Registrar entrada"
        limpiarAlGuardar
      >
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={fecha} max={fecha} required />
          <Campo etiqueta="Detalle (factura, proveedor…)" name="detalle" placeholder="Ej.: Compra FV-10234" />
        </div>
        <div className="overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Existencia</th>
                <th className="w-40 px-4 py-3 text-right font-medium">Llegaron</th>
                <th className="px-4 py-3 text-right font-medium">Quedará con</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 font-semibold">{p.nombre}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">{p.existencia.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-1.5">
                    <CampoCantidad
                      name={`cantidad-${p.id}`}
                      etiqueta={`Llegaron de ${p.nombre}`}
                      onCambio={(n) => setCantidades((c) => ({ ...c, [p.id]: n ?? 0 }))}
                    />
                  </td>
                  <td className={`px-4 py-2 text-right font-bold tabular-nums ${cantidades[p.id] ? "text-emerald-700" : ""}`}>
                    {(p.existencia + (cantidades[p.id] ?? 0)).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productos.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No hay productos activos.</p>}
        </div>
        <p className="text-sm text-slate-600">
          Total de la entrada: <b>{total.toLocaleString("es-CO")} manillas</b>.
        </p>
      </Formulario>
    </section>
  );
}
