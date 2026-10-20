// Envío de correos por SMTP (Gmail por defecto) desde Cloudflare Workers, con los
// sockets TCP de Cloudflare. Variables: CORREO_USUARIO (la cuenta que envía) y
// CORREO_CONTRASENA (contraseña de aplicación de Gmail). Opcionales: CORREO_HOST
// y CORREO_PUERTO (465 = conexión cifrada desde el inicio).

type Socket = {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  close(): Promise<void>;
};

export function correoConfigurado() {
  return Boolean(process.env.CORREO_USUARIO);
}

// Codifica texto UTF-8 para los encabezados del correo (asunto, nombres).
function encabezado(texto: string) {
  return `=?UTF-8?B?${base64(texto)}?=`;
}

function base64(texto: string) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

// Base64 en líneas de 76 caracteres, como pide el formato de correo.
function cuerpo(texto: string) {
  return base64(texto).replace(/.{76}/g, "$&\r\n");
}

export async function enviarCorreo({
  para,
  asunto,
  texto,
  html,
}: {
  para: string;
  asunto: string;
  texto: string;
  html: string;
}) {
  const usuario = process.env.CORREO_USUARIO;
  if (!usuario) throw new Error("El envío de correos no está configurado (falta CORREO_USUARIO).");
  const contrasena = process.env.CORREO_CONTRASENA;
  const host = process.env.CORREO_HOST ?? "smtp.gmail.com";
  const puerto = Number(process.env.CORREO_PUERTO ?? 465);

  // Solo existe dentro del Worker de Cloudflare. Los comentarios evitan que Next.js
  // intente resolverlo, y el .catch hace que el empaquetado de Cloudflare lo deje
  // para el momento de ejecución en vez de fallar al compilar.
  const modulo = "cloudflare:sockets";
  const { connect } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ modulo).catch(
    (error: unknown) => {
      throw error;
    },
  )) as { connect(destino: { hostname: string; port: number }, opciones: { secureTransport: "on" | "off" }): Socket };

  const socket = connect({ hostname: host, port: puerto }, { secureTransport: puerto === 465 ? "on" : "off" });
  const lector = socket.readable.getReader();
  const escritor = socket.writable.getWriter();
  const decodificador = new TextDecoder();
  let pendiente = "";

  // Lee una respuesta completa del servidor (las líneas "250-" continúan, "250 " termina).
  async function respuesta(esperado: number) {
    for (;;) {
      const lineas = pendiente.split("\r\n");
      const fin = lineas.findIndex((l) => /^\d{3} /.test(l));
      if (fin >= 0) {
        pendiente = lineas.slice(fin + 1).join("\r\n");
        const codigo = Number(lineas[fin].slice(0, 3));
        if (codigo !== esperado) throw new Error(`SMTP respondió "${lineas[fin]}" (se esperaba ${esperado}).`);
        return;
      }
      const { value, done } = await lector.read();
      if (done) throw new Error("El servidor de correo cerró la conexión.");
      pendiente += decodificador.decode(value, { stream: true });
    }
  }

  async function enviar(linea: string, esperado: number) {
    await escritor.write(new TextEncoder().encode(linea + "\r\n"));
    await respuesta(esperado);
  }

  const limite = `ponycash-${crypto.randomUUID()}`;
  const mensaje = [
    `From: ${encabezado("PonyCash")} <${usuario}>`,
    `To: <${para}>`,
    `Subject: ${encabezado(asunto)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${usuario.split("@")[1]}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${limite}"`,
    "",
    `--${limite}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    cuerpo(texto),
    `--${limite}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    cuerpo(html),
    `--${limite}--`,
  ].join("\r\n");

  try {
    await respuesta(220);
    await enviar("EHLO ponycash", 250);
    if (contrasena) await enviar(`AUTH PLAIN ${base64(`\0${usuario}\0${contrasena}`)}`, 235);
    await enviar(`MAIL FROM:<${usuario}>`, 250);
    await enviar(`RCPT TO:<${para}>`, 250);
    await enviar("DATA", 354);
    // Base64 no produce líneas que empiecen con ".", así que el mensaje termina limpio.
    await enviar(`${mensaje}\r\n.`, 250);
    await enviar("QUIT", 221);
  } finally {
    await socket.close().catch(() => {});
  }
}
