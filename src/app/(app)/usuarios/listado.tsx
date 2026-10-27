"use client";

// Listado de usuarios con buscador y los mismos botones redondos de los demás
// listados: crear, editar, bloquear/desbloquear y eliminar.
import { useState } from "react";
import {
  Aviso,
  BarraAcciones,
  CabeceraListado,
  VentanaFormulario,
  claseEncabezadoFijo,
  claseFila,
  claseTablaDesplazable,
  normalizar,
  useListado,
} from "@/components/listado";
import { Campo, Insignia, Selector } from "@/components/ui";
import { cambiarBloqueo, eliminarUsuario, guardarUsuario } from "./actions";

type Usuario = {
  id: string;
  name: string;
  email: string;
  banned: boolean | null;
  createdAt: Date;
  role: string | null;
};

function nombreDelRol(role: string | null) {
  return role === "admin" ? "Administrador" : "Usuario";
}

export function ListadoUsuarios({ usuarios, yoId }: { usuarios: Usuario[]; yoId: string }) {
  const [busqueda, setBusqueda] = useState("");
  const { seleccionadaId, setSeleccionadaId, ventana, setVentana, aviso, setAviso, ocupado, ejecutar } =
    useListado<string>();

  const filtro = normalizar(busqueda.trim());
  const visibles = usuarios.filter((u) => normalizar(`${u.name} ${u.email}`).includes(filtro));
  const seleccionado = usuarios.find((u) => u.id === seleccionadaId) ?? null;
  const soyYo = seleccionado?.id === yoId;
  const editando = ventana === "editar" ? seleccionado : null;

  return (
    <div className="max-w-5xl space-y-6">
      <CabeceraListado
        titulo="Usuarios"
        buscar="Buscar usuario"
        placeholder="Digite nombre o correo"
        busqueda={busqueda}
        onBuscar={setBusqueda}
        botones={
          <BarraAcciones
            singular="usuario"
            activa={!seleccionado?.banned}
            sinEditar={!seleccionado || ocupado}
            // Nadie puede bloquearse ni eliminarse a sí mismo.
            sinCambiarEstado={!seleccionado || soyYo || ocupado}
            sinEliminar={!seleccionado || soyYo || ocupado}
            onCrear={() => setVentana("crear")}
            onEditar={() => setVentana("editar")}
            onCambiarEstado={() => seleccionado && ejecutar(() => cambiarBloqueo(seleccionado.id))}
            onEliminar={() => {
              if (!seleccionado) return;
              if (!window.confirm(`¿Eliminar al usuario "${seleccionado.name}"? No se puede deshacer.`)) return;
              ejecutar(() => eliminarUsuario(seleccionado.id), () => setSeleccionadaId(null));
            }}
          />
        }
      />

      <Aviso estado={aviso} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs text-slate-500">
          {usuarios.length} usuario(s) registrados. Haz clic en una fila para seleccionarla; doble clic para editarla.
          {soyYo && " Este eres tú: no puedes bloquearte, eliminarte ni cambiar tu rol."}
        </p>
        <div className={claseTablaDesplazable}>
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((u) => {
                const activa = u.id === seleccionadaId;
                return (
                  <tr
                    key={u.id}
                    aria-selected={activa}
                    onClick={() => setSeleccionadaId(activa ? null : u.id)}
                    onDoubleClick={() => {
                      setSeleccionadaId(u.id);
                      setVentana("editar");
                    }}
                    className={claseFila(true, activa)}
                  >
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Insignia color={u.role === "admin" ? "marca" : "gris"}>{nombreDelRol(u.role)}</Insignia>
                    </td>
                    <td className="px-4 py-3">
                      {u.banned ? <Insignia color="rojo">Bloqueado</Insignia> : <Insignia color="verde">Activo</Insignia>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString("es-CO")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibles.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Ningún usuario coincide con la búsqueda.</p>
        )}
      </section>

      {ventana && (
        <VentanaFormulario
          key={editando ? `editar-${editando.id}` : "crear"}
          titulo={editando ? "Editar usuario" : "Nuevo usuario"}
          textoBoton={editando ? "Guardar cambios" : "Crear usuario"}
          accion={guardarUsuario}
          onCerrar={() => setVentana(null)}
          onGuardado={(estado) => {
            setAviso(estado);
            setVentana(null);
          }}
        >
          <input type="hidden" name="id" value={editando?.id ?? ""} />
          <Campo etiqueta="Nombre" name="name" defaultValue={editando?.name} required autoFocus />
          <Campo etiqueta="Correo" name="email" type="email" defaultValue={editando?.email} required />
          {editando?.id !== yoId && (
            <Selector etiqueta="Rol" name="role" defaultValue={editando?.role === "admin" ? "admin" : "user"}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </Selector>
          )}
          <Campo
            etiqueta={editando ? "Nueva contraseña (déjala vacía para no cambiarla)" : "Contraseña"}
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required={!editando}
          />
        </VentanaFormulario>
      )}
    </div>
  );
}
