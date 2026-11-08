# API de tareas

Proyecto base para la primera entrega de Integración Continua del Politécnico Grancolombiano. La API está escrita en TypeScript y usa Node.js, Express y Redis. Registrar una tarea y consultarla permite comprobar que la API escribe y lee datos en Redis.

## Probar la API

Necesitas Node.js 24 o posterior, npm y una instancia de Redis. Desde la raíz del repositorio:

```sh
npm ci
npm run build
npm start
```

Por defecto, la API escucha en el puerto 8000 y busca Redis en `redis://127.0.0.1:6379/0`. Puedes configurar otra dirección con la variable `REDIS_URL` y otro puerto con `PORT`.

| Método y ruta | Para qué sirve | Resultado esperado |
| --- | --- | --- |
| `GET /salud` | Comprueba que la API se conecta a Redis | HTTP 200 y `{"api":"ok","redis":"conectado"}` |
| `POST /tareas` | Guarda el campo `titulo` recibido como JSON | HTTP 201 y el título guardado |
| `GET /tareas` | Lee las tareas guardadas en Redis | HTTP 200 y un objeto con la lista `tareas` |

Para crear una tarea y verificar que aparece al consultar:

```sh
curl -i http://localhost:8000/salud

curl -i http://localhost:8000/tareas \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Comprobar la integración"}'

curl -i http://localhost:8000/tareas
```

En Postman, usa el método POST para crear la tarea y selecciona **Body → raw → JSON**. El título debe tener de 1 a 120 caracteres. La API responde con HTTP 400 si el JSON no contiene un título válido, 415 si el cuerpo no es JSON y 503 si Redis no está disponible.

## Datos para quien integra Docker

| Configuración | Valor |
| --- | --- |
| Código y configuración | `src/`, `package.json` y `tsconfig.json` |
| Versión de Node.js | 24 o posterior |
| Compilación | `npm ci` instala las dependencias y `npm run build` genera `dist/` |
| Comando de arranque | `node dist/index.js` |
| Puerto interno de la API | `8000` |
| Variable para conectar a Redis | `REDIS_URL=redis://redis:6379/0` si el servicio se llama `redis` |
| Ruta para comprobar la conexión | `GET /salud` |

En Docker, cambia el host de `REDIS_URL` si el servicio de datos recibe otro nombre. La API escucha en `0.0.0.0` para recibir solicitudes por el puerto que publique Docker. Para la demostración, muestra un POST exitoso y el mismo título en el GET o en `redis-cli LRANGE tareas 0 -1` dentro del contenedor de Redis.