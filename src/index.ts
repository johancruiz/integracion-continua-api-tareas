import { createClient } from "redis";
import { crearApi } from "./app.js";

const puerto = Number(process.env.PORT ?? "8000");
if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
  throw new Error("PORT debe ser un número entero entre 1 y 65535.");
}

const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379/0",
  disableOfflineQueue: true,
  socket: { connectTimeout: 1000 },
});
redis.on("error", (error: Error) => {
  console.warn("Error de conexión a Redis:", error.name);
});

const claveTareas = "tareas";
const api = crearApi({
  listar: () => redis.lRange(claveTareas, 0, -1),
  guardar: (titulo) => redis.rPush(claveTareas, titulo),
  comprobarConexion: () => redis.ping(),
});

api.listen(puerto, "0.0.0.0", (error?: Error) => {
  if (error) {
    console.error(`No se pudo iniciar la API en el puerto ${puerto}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`API de tareas escuchando en el puerto ${puerto}.`);
  void redis.connect().catch(() => {
    console.error("No se pudo establecer la conexión inicial con Redis.");
  });
});
