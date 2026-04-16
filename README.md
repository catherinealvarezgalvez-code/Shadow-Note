# Shadow Note

Aplicación de notas con backend PHP + SQLite y PWA offline.

## Estructura completa
- `config.php`: configuración principal y ruta de la base de datos.
- `src/db.php`: helper para conectar a SQLite con PDO.
- `src/init_db.php`: script para crear el esquema inicial.
- `src/auth.php`: funciones para registro, login, hash de contraseña y verificación JWT.
- `src/jwt.php`: generación y verificación de tokens JWT.
- `src/note.php`: funciones CRUD para notas.
- `api/auth.php`: endpoints API para registro y login.
- `api/notes.php`: endpoints API para gestionar notas (protegidos con JWT).
- `index.php`: página principal con interfaz de usuario.
- `assets/css/style.css`: estilos responsivos y modernos.
- `assets/js/app.js`: JavaScript para consumir API y manejar JWT.
- `manifest.json`: configuración PWA.
- `service-worker.js`: service worker para soporte offline.

## Parte 2: Backend de autenticación y notas
- `src/auth.php`: funciones para registro, login, hash de contraseña y verificación de JWT.
- `src/jwt.php`: generación y verificación de tokens JWT.
- `src/note.php`: funciones CRUD para notas.
- `api/auth.php`: endpoints API para registro y login.
- `api/notes.php`: endpoints API para gestionar notas (protegidos con JWT).

## Primer paso
Ejecuta en el navegador o en terminal:

```bash
php src/init_db.php
```

Esto creará el archivo `data/database.sqlite` y las tablas `users`, `notes`, `logs`.

## Flujo de la segunda parte
1. El frontend envía JSON a `api/auth.php` con `action: 'register'` o `'login'`.
2. `api/auth.php` llama a `src/auth.php` que valida datos y genera JWT.
3. Para notas, el frontend envía JWT en header `Authorization: Bearer <token>`.
4. `api/notes.php` verifica el token con `src/jwt.php` y llama a `src/note.php` para operaciones CRUD.

## Parte 3: Frontend y PWA
- **Interfaz moderna**: HTML5, CSS3 con diseño responsivo y gradientes.
- **JavaScript SPA**: Una sola página que maneja auth y notas dinámicamente.
- **PWA completa**: Service Worker con estrategias de cache offline.
- **Offline first**: Detecta conexión y funciona sin internet usando cache.

## Flujo del frontend
1. **Carga inicial**: Verifica JWT en localStorage.
2. **Auth**: Formularios de login/registro que llaman a `api/auth.php`.
3. **Main app**: Lista notas desde `api/notes.php`, permite CRUD completo.
4. **Offline**: Service Worker cachea app y datos para funcionamiento sin red.
5. **Responsive**: Funciona en móvil y desktop.

## Cómo usar
1. Abre `http://localhost/Shadow-Note/` en tu navegador.
2. Regístrate con email y contraseña.
3. Crea, edita y elimina notas.
4. La app funciona offline después de la primera carga.

## Características PWA
- **Instalable**: Se puede instalar como app nativa.
- **Offline**: Funciona sin conexión usando cache.
- **Fast**: Carga rápida con service worker.
- **Responsive**: Diseño adaptativo para todos los dispositivos.
