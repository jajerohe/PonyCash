"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import { CampoCantidad } from "@/components/cantidades";
import { Aviso, claseEncabezadoFijo } from "@/components/listado";
import { Boton } from "@/components/ui";
import type { Estado } from "@/lib/errores";

type Fila = { productoId: number; nombre: string; anterior: number; recibidas: number; final: number | null };

export function Planilla({
  filas,
  cerrada,
  accion,
  reabrir,
}: {
  filas: Fila[];
  cerrada: boolean;
  accion: (estado: Estado, datos: FormData) => Promise<Estado>;
  reabrir?: () => Promise<Estado>;
}) {
  const router = useRouter();
  const [estado, enviar, pendiente] = useActionState(accion, null);
  const [aviso, setAviso] = useState<Estado>(null);
  const [reabriendo, setReabriendo] = useState(false);
  // Lo que se va escribiendo en "Final"; undefined = todavía vacío.
  const [finales, setFinales] = useState<Record<number, number | undefined>>(() =>
    Object.fromEntries(filas.map((f) => [f.productoId, f.final ?? undefined])),
  );

  const inicial = (f: Fila) => f.anterior + f.recibidas;
  const suma = (fn: (f: Fila) => number) => filas.reduce((a, f) => a + fn(f), 0);
  const totalInicial = suma(inicial);
  const totalFinal = suma((f) => finales[f.productoId] ?? 0);
  const faltan = filas.filter((f) => finales[f.productoId] === undefined).length;
  const errores = filas.filter((f) => (finales[f.productoId] ?? 0) > inicial(f));
  const vendidas = totalInicial - totalFinal;

  const masVendidos = filas
    .map((f) => ({ nombre: f.nombre, v: finales[f.productoId] === undefined ? 0 : inicial(f) - finales[f.productoId]! }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  if (filas.length === 0 && !cerrada) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Este punto no tiene manillas, así que no hay nada que contar. Primero agrégale manillas.
      </p>
    );
  }

  return (
    <form
      className="grid gap-5 lg:grid-cols-[1fr_17rem]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm(`Se descontarán ${vendidas} manillas vendidas del inventario general. ¿Confirmar el cierre?`)) return;
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-auto border-t border-slate-300">
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
              <tr>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 text-right font-medium">Le quedó antes</th>
                <th className="px-4 py-3 text-right font-medium">Recibió hoy</th>
                <th className="px-4 py-3 text-right font-medium">Inicial</th>
                <th className="w-32 px-4 py-3 text-right font-medium">Final</th>
                <th className="px-4 py-3 text-right font-medium">Vendidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f) => {
                const final = finales[f.productoId];
                const malo = final !== undefined && final > inicial(f);
                return (
                  <tr key={f.productoId} className={malo ? "bg-red-50" : ""}>
                    <td className="px-4 py-2 font-semibold">{f.nombre}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-500">{f.anterior}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${f.recibidas ? "text-sky-700" : "text-slate-300"}`}>{f.recibidas}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{inicial(f)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      {cerrada ? (
                        f.final
                      ) : (
                        <CampoCantidad
                          name={`final-${f.productoId}`}
                          etiqueta={`Quedaron de ${f.nombre}`}
                          max={inicial(f)}
                          onCambio={(n) => setFinales((v) => ({ ...v, [f.productoId]: n ?? undefined }))}
                        />
                      )}
                    </td>
                    <td className={`px-4 py-2 text-right font-bold tabular-nums ${malo ? "text-red-600" : "text-emerald-700"}`}>
                      {final === undefined ? <span className="text-slate-300">—</span> : inicial(f) - final}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-crema-50 font-bold">
                <td className="px-4 py-2.5">TOTAL MANILLAS</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{suma((f) => f.anterior)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-sky-700">{suma((f) => f.recibidas)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{totalInicial}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{totalFinal}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{vendidas}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Vendidas</p>
          <p className="text-4xl font-bold text-emerald-700">{vendidas}</p>
          <p className="mt-1 text-sm text-slate-500">
            Inicial {totalInicial} − quedaron {totalFinal}
          </p>
        </div>
        {masVendidos.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <p className="mb-2 font-semibold">Más vendidos</p>
            <ol className="space-y-1 text-slate-600">
              {masVendidos.map((m) => (
                <li key={m.nombre} className="flex justify-between gap-2">
                  <span>{m.nombre}</span>
                  <b>{m.v}</b>
                </li>
              ))}
            </ol>
          </div>
        )}

        {cerrada ? (
          <>
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Las {vendidas} vendidas ya se descontaron del inventario general. Las {totalFinal} que quedaron siguen en el punto.
            </p>
            <Aviso estado={aviso} />
            {reabrir && (
              <Boton
                type="button"
                variante="secundario"
                className="w-full"
                disabled={reabriendo}
                onClick={() => {
                  if (!window.confirm("Se borrarán las ventas de este cierre y la jornada quedará abierta para corregirla. ¿Reabrir?")) return;
                  setReabriendo(true);
                  startTransition(async () => {
                    const r = await reabrir();
                    setAviso(r);
                    setReabriendo(false);
                    if (r?.ok) router.refresh();
                  });
                }}
              >
                {reabriendo ? "Reabriendo…" : "Reabrir jornada"}
              </Boton>
            )}
          </>
        ) : (
          <>
            {errores.length > 0 && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                En {errores.map((f) => f.nombre).join(", ")} quedaron más de las que tenía el punto.
              </p>
            )}
            {estado && !estado.ok && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{estado.mensaje}</p>}
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Al confirmar se descuentan las vendidas del inventario general. Las que quedaron siguen en el punto para la siguiente jornada.
            </p>
            <Boton type="submit" className="w-full" disabled={pendiente || faltan > 0 || errores.length > 0}>
              {pendiente ? "Cerrando…" : faltan > 0 ? `Faltan ${faltan} producto(s) por contar` : "Confirmar cierre"}
            </Boton>
          </>
        )}
      </div>
    </form>
  );
}
