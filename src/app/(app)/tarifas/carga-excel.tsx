"use client";

// Ventana para cargar tarifas desde Excel: leer el archivo, ver la revisión
// fila por fila y confirmar la carga.
import { useState } from "react";
import { VentanaFormulario } from "@/components/listado";
import { Insignia } from "@/components/ui";
import type { Estado } from "@/lib/errores";
import { formatearFecha, formatearPesos } from "@/lib/fechas";
import { normalizar } from "@/lib/texto";
import { confirmarCarga, revisarCarga, type FilaArchivo, type Revision } from "./carga";

// Encabezados aceptados para cada columna (sin tildes ni mayúsculas).
const COLUMNAS: Record<keyof Omit<FilaArchivo, "fila">, string[]> = {
  producto: ["producto", "nombre producto", "manilla", "nombre manilla"], // "manilla": plantillas anteriores
  tipo: ["tipo", "tipo tarifa", "tipo de tarifa"],
  valor: ["valor", "precio"],
  desde: ["desde", "fecha desde", "fecha inicio", "inicio"],
  hasta: ["hasta", "fecha hasta", "fecha fin", "fin"],
};

// Celda de Excel → texto. Las fechas se pasan a "AAAA-MM-DD".
function aTexto(celda: unknown) {
  if (celda instanceof Date) return celda.toISOString().slice(0, 10);
  if (celda === null || celda === undefined) return "";
  return String(celda).trim();
}

async function leerArchivo(archivo: File): Promise<FilaArchivo[]> {
  const { readSheet } = await import("read-excel-file/browser");
  const datos = await readSheet(archivo);
  const [encabezado = [], ...resto] = datos;
  const titulos = encabezado.map((c) => normalizar(aTexto(c)));

  const posicion = {} as Record<keyof typeof COLUMNAS, number>;
  const faltan: string[] = [];
  for (const [campo, nombres] of Object.entries(COLUMNAS) as [keyof typeof COLUMNAS, string[]][]) {
    const i = titulos.findIndex((t) => nombres.includes(t));
    if (i < 0) faltan.push(nombres[0]);
    posicion[campo] = i;
  }
  if (faltan.length > 0) {
    throw new Error(`Al archivo le faltan las columnas: ${faltan.join(", ")}. Usa la plantilla.`);
  }

  return resto
    .map((celdas, i) => ({
      fila: i + 2, // La fila 1 es el encabezado
      producto: aTexto(celdas[posicion.producto]),
      tipo: aTexto(celdas[posicion.tipo]),
      valor: aTexto(celdas[posicion.valor]),
      desde: aTexto(celdas[posicion.desde]),
      hasta: aTexto(celdas[posicion.hasta]),
    }))
    .filter((f) => f.producto || f.tipo || f.valor || f.desde || f.hasta); // Sin filas vacías
}

const insigniaAccion = {
  nueva: <Insignia color="verde">Nueva</Insignia>,
  actualiza: <Insignia color="marca">Actualiza</Insignia>,
  error: <Insignia color="rojo">Error</Insignia>,
};

export function CargaTarifas({ onCerrar, onCargado }: { onCerrar: () => void; onCargado: (estado: Estado) => void }) {
  const [filas, setFilas] = useState<FilaArchivo[]>([]);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [problema, setProblema] = useState("");
  const [leyendo, setLeyendo] = useState(false);

  async function alElegir(archivo: File | undefined) {
    setRevision(null);
    setFilas([]);
    setProblema("");
    if (!archivo) return;
    setLeyendo(true);
    try {
      const leidas = await leerArchivo(archivo);
      if (leidas.length === 0) throw new Error("El archivo no tiene filas con tarifas.");
      const resultado = await revisarCarga(leidas);
      if ("error" in resultado) throw new Error(resultado.error);
      setFilas(leidas);
      setRevision(resultado);
    } catch (error) {
      setProblema(
        error instanceof Error && error.message
          ? error.message
          : "No se pudo leer el archivo. Verifica que sea un Excel (.xlsx).",
      );
    } finally {
      setLeyendo(false);
    }
  }

  const listo = !!revision && revision.errores === 0;

  return (
    <VentanaFormulario
      titulo="Cargar tarifas desde Excel"
      textoBoton={revision ? `Cargar ${revision.filas.length} tarifa(s)` : "Cargar tarifas"}
      accion={confirmarCarga}
      onCerrar={onCerrar}
      onGuardado={onCargado}
      sinEnviar={!listo}
      ancha
    >
      <input type="hidden" name="filas" value={JSON.stringify(filas)} />
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
        <li>
          Descarga la{" "}
          <a href="/plantilla-tarifas.xlsx" download className="font-medium text-marca-600 underline">
            plantilla de Excel
          </a>{" "}
          y llénala: Producto, Tipo, Valor, Desde y Hasta (una tarifa por fila).
        </li>
        <li>Los nombres de producto y tipo deben ser iguales a los del sistema (las tildes no importan).</li>
        <li>
          Si la fila es de un producto y tipo que ya tiene tarifa con fechas que se cruzan, actualiza la
          predeterminada del producto o la que tenga exactamente las mismas fechas.
        </li>
      </ol>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Archivo de Excel (.xlsx)</span>
        <input
          type="file"
          name="archivo"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => alElegir(e.target.files?.[0])}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-marca-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-marca-700"
        />
      </label>

      {leyendo && <p className="text-sm text-slate-500">Revisando el archivo…</p>}
      {problema && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{problema}</p>}

      {revision && (
        <>
          <p
            className={`rounded-lg px-3 py-2 text-sm ${listo ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
          >
            {revision.nuevas} nueva(s) · {revision.actualizadas} actualización(es) · {revision.errores} con error.{" "}
            {listo ? "Todo listo para cargar." : "Corrige los errores en el archivo y vuelve a elegirlo."}
          </p>
          <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-crema-50 uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Fila</th>
                  <th className="px-3 py-2 font-medium">Producto</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium">Desde</th>
                  <th className="px-3 py-2 font-medium">Hasta</th>
                  <th className="px-3 py-2 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revision.filas.map((f) => (
                  <tr key={f.fila} className={f.accion === "error" ? "bg-red-50/60" : ""}>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{f.fila}</td>
                    <td className="px-3 py-2 font-medium">{f.producto}</td>
                    <td className="px-3 py-2">{f.tipo}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {f.valor === null ? "—" : formatearPesos(f.valor)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {/^\d{4}-\d{2}-\d{2}$/.test(f.desde) ? formatearFecha(f.desde) : f.desde}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {/^\d{4}-\d{2}-\d{2}$/.test(f.hasta) ? formatearFecha(f.hasta) : f.hasta}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-start gap-2">
                        {insigniaAccion[f.accion]}
                        <span className={f.accion === "error" ? "text-red-700" : "text-slate-500"}>{f.mensaje}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </VentanaFormulario>
  );
}
