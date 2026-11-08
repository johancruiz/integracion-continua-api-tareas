import express from "express";
import type { ErrorRequestHandler } from "express";

export interface AlmacenTareas {
  listar(): Promise<string[]>;
  guardar(titulo: string): Promise<unknown>;
  comprobarConexion(): Promise<unknown>;
}

class AlmacenNoDisponible extends Error {}

async function usarAlmacen<T>(operacion: () => Promise<T>): Promise<T> {
  try {
    return await operacion();
  } catch (error) {
    throw new AlmacenNoDisponible("Redis no está disponible.", { cause: error });
  }
}

export function crearApi(almacen: AlmacenTareas) {
  const api = express();
  const tiposJson = ["application/json", "application/*+json"];
  const leerJson = express.json({ limit: "4kb", type: tiposJson });

  api.get("/salud", async (_req, res) => {
    await usarAlmacen(() => almacen.comprobarConexion());
    res.json({ api: "ok", redis: "conectado" });
  });

  api.get("/tareas", async (_req, res) => {
    const titulos = await usarAlmacen(() => almacen.listar());
    res.json({ tareas: titulos.map((titulo) => ({ titulo })) });
  });

  api.post("/tareas", leerJson, async (req, res) => {
    if (!req.get("content-type") || req.is(tiposJson) === false) {
      res.status(415).json({ error: "Envía un cuerpo JSON con Content-Type: application/json." });
      return;
    }

    const entrada: unknown = req.body?.titulo;
    const titulo = typeof entrada === "string" ? entrada.trim() : "";
    if (!titulo || [...titulo].length > 120) {
      res.status(400).json({ error: "El campo titulo debe contener de 1 a 120 caracteres." });
      return;
    }

    await usarAlmacen(() => almacen.guardar(titulo));
    res.status(201).json({ titulo });
  });

  const responderError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    if (error instanceof AlmacenNoDisponible) {
      res.status(503).json({ error: error.message });
      return;
    }
    if (error.status === 400) {
      res.status(400).json({ error: "El cuerpo JSON no es válido." });
      return;
    }
    if (error.status === 413) {
      res.status(413).json({ error: "El cuerpo de la solicitud supera los 4 KiB." });
      return;
    }
    if (error.status === 415) {
      res.status(415).json({ error: "El formato del cuerpo JSON no es compatible." });
      return;
    }
    console.error("Error inesperado al atender la solicitud.");
    res.status(500).json({ error: "Error interno de la API." });
  };
  api.use(responderError);

  return api;
}
