<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shadow Note</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="manifest" href="manifest.json">
</head>
<body>
    <div id="app">
        <!-- Login/Register forms will be shown here when not authenticated -->
        <div id="auth-section" class="auth-section">
            <div class="auth-container">
                <h1>Shadow Note</h1>
                <p>Aplicación de notas con soporte offline</p>

                <!-- Login Form -->
                <form id="login-form" class="auth-form">
                    <h2>Iniciar Sesión</h2>
                    <div class="form-group">
                        <input type="email" id="login-email" placeholder="Email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="login-password" placeholder="Contraseña" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
                    <p class="auth-switch">¿No tienes cuenta? <a href="#" id="show-register">Regístrate</a></p>
                </form>

                <!-- Register Form -->
                <form id="register-form" class="auth-form hidden">
                    <h2>Crear Cuenta</h2>
                    <div class="form-group">
                        <input type="email" id="register-email" placeholder="Email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="register-password" placeholder="Contraseña (mín. 6 caracteres)" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Crear Cuenta</button>
                    <p class="auth-switch">¿Ya tienes cuenta? <a href="#" id="show-login">Inicia sesión</a></p>
                </form>

                <div id="auth-message" class="message hidden"></div>
            </div>
        </div>

        <!-- Main app will be shown here when authenticated -->
        <div id="main-app" class="main-app hidden">
            <header class="app-header">
                <h1>Shadow Note</h1>
                <div class="user-info">
                    <span id="user-email"></span>
                    <button id="sync-btn" class="btn btn-secondary" style="display:none;" title="Sincronizar cambios offline">🔄 Sincronizar</button>
                    <button id="logout-btn" class="btn btn-secondary">Cerrar Sesión</button>
                </div>
            </header>

            <div class="app-content">
                <div class="notes-section">
                    <div class="notes-header">
                        <h2>Mis Notas</h2>
                        <button id="new-note-btn" class="btn btn-primary">Nueva Nota</button>
                    </div>

                    <div id="notes-list" class="notes-list">
                        <!-- Notes will be loaded here -->
                    </div>
                </div>

                <div id="note-editor" class="note-editor hidden">
                    <div class="editor-header">
                        <input type="text" id="note-title" placeholder="Título de la nota" maxlength="100">
                        <div class="editor-actions">
                            <button id="save-note-btn" class="btn btn-primary">Guardar</button>
                            <button id="cancel-edit-btn" class="btn btn-secondary">Cancelar</button>
                        </div>
                    </div>
                    <textarea id="note-body" placeholder="Escribe tu nota aquí..."></textarea>
                </div>
            </div>

            <div id="app-message" class="message hidden"></div>
        </div>
    </div>

    <script src="assets/js/app.js"></script>
</body>
</html>