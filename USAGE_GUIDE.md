# Shadow Note - Guía de Uso

## Requisitos Previos
- Apache/XAMPP ejecutándose
- Navegador moderno (Chrome, Firefox, Edge)
- Conexión a internet para el primer login

## Instalación Inicial

1. **Acceder a la aplicación:**
   - `http://localhost/Shadow-Note/`
   - O `http://127.0.0.1/Shadow-Note/`

2. **Crear cuenta o loguear:**
   - Primera vez: Haz clic en "Regístrate"
   - Ingresa email y contraseña (mín. 6 caracteres)
   - Ya tienes cuenta: Usa "Iniciar Sesión"

## Flujo Online (Conectado)

### Login
1. Ingresa email y contraseña
2. Haz clic en "Iniciar Sesión"
3. Se cargará el dashboard con tus notas

### Crear Nota
1. Haz clic en "Nueva Nota"
2. Ingresa título y contenido
3. Haz clic en "Guardar"
4. La nota se almacena en el servidor y sincroniza con el SW

### Editar Nota
1. Haz clic en la nota que deseas editar
2. Modifica el contenido
3. Haz clic en "Guardar"

### Eliminar Nota
1. Haz clic en el botón "Eliminar" en la nota
2. Confirma la eliminación

### Logout
1. Haz clic en "Cerrar Sesión"
2. Se limpiarán todos los datos locales
3. Volverás al formulario de login

## Flujo Offline (Sin Conexión)

### Cómo Activar Modo Offline
1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Marca la casilla "Offline"

### Qué Funciona en Offline
- Ver notas guardadas anteriormente
- Crear nuevas notas (se guardan localmente)
- Editar notas
- Eliminar notas

### Qué NO Funciona en Offline
- Login/Logout (requiere validación del servidor)
- Sincronización con el server

### Sincronización Automática
- Cuando vuelvas a conectarte, las operaciones pendientes se sincronizan automáticamente
- Recibirás un mensaje confirmando la sincronización

## Modo PWA (Instalable)

La aplicación es una PWA (Progressive Web App) y puede instalarse:

1. **Desde Chrome:**
   - Haz clic en el ícono de instalación (arriba a la derecha)
   - O: Menú → "Instalar Shadow Note"

2. **Desde otros navegadores:**
   - Sigue las instrucciones del navegador para instalar PWA

Una vez instalada:
- Puedes ejecutarla como una app de escritorio
- Funciona offline completamente
- Se actualiza automáticamente

## Troubleshooting

### Problemas al Loguear
- Verifica que estés **Online** (Offline → Online)
- Recarga la página (Ctrl+F5)
- Limpia cache del navegador

### Service Worker Antiguo
1. Abre DevTools → Application → Service Workers
2. Haz clic en "Unregister"
3. Ve a Storage → Cache storage
4. Elimina todos los caches
5. Recarga (Ctrl+Shift+R)

### Notas no se Sincronizan
1. Verifica conexión a internet
2. La sincronización es automática al conectarse
3. Revisa la consola para mensajes de error

## Características Técnicas

- **Backend:** PHP 8.2 + SQLite3
- **Frontend:** HTML5 + CSS3 + JavaScript ES6+
- **Autenticación:** JWT (JSON Web Tokens)
- **PWA:** Service Worker + Manifest
- **Sync:** Operaciones pendientes en offline
