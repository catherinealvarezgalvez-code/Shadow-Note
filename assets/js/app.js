// Shadow Note - JavaScript principal
class ShadowNoteApp {
    constructor() {
        this.token = localStorage.getItem('shadow_note_token');
        this.user = null;
        this.notes = [];
        this.currentNoteId = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();

        // Registrar service worker para PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/Shadow-Note/service-worker.js')
                .then(reg => {
                    console.log('Service Worker registrado', reg.scope);
                })
                .catch(err => {
                    console.error('Error registrando SW:', err);
                });
        }
    }

    bindEvents() {
        // Auth forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Main app
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('new-note-btn').addEventListener('click', () => this.showNoteEditor());
        document.getElementById('save-note-btn').addEventListener('click', () => this.saveNote());
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.hideNoteEditor());

        // Online/Offline detection
        window.addEventListener('online', () => {
            console.log('Evento online disparado');
            this.showMessage('Conexión restaurada', 'success');
            this.syncPendingOperations();
        });
        window.addEventListener('offline', () => {
            console.log('Evento offline disparado');
            this.showMessage('Modo offline activado', 'info');
        });

        // Verificar estado de conexión cada 5 segundos
        setInterval(() => {
            if (navigator.onLine && this.token) {
                const pending = this.getPendingOperations();
                if (pending.length > 0) {
                    console.log('Verificación periódica: encontradas', pending.length, 'operaciones pendientes');
                    this.syncPendingOperations();
                }
            }
        }, 5000);
    }

    checkAuth() {
        if (this.token) {
            // Verificar si el token es válido o usar el modo offline
            this.verifyToken().then(valid => {
                if (valid) {
                    this.showMainApp();
                    this.loadNotes().then(() => {
                        // Después de cargar las notas, sincronizar operaciones pendientes
                        this.syncPendingOperations();
                        // Mostrar estado de sincronización
                        setTimeout(() => this.showSyncStatus(), 1000);
                    });
                } else {
                    console.warn('Token inválido, limpiando sesión');
                    this.logout();
                }
            }).catch(err => {
                console.error('Error verificando token:', err);
                this.logout();
            });
        } else {
            this.showAuthSection();
        }
    }

    async verifyToken() {
        if (!navigator.onLine) {
            // En modo offline, asumimos que el token es válido si ya estaba guardado.
            return true;
        }

        try {
            const response = await fetch('api/notes.php', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.log('Error verificando token:', error);
            return false;
        }
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!navigator.onLine) {
            this.showMessage('Sin conexión a internet. Por favor, revisa tu conexión.',  'error');
            return;
        }

        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                localStorage.setItem('shadow_note_token', this.token);
                this.showMessage('Inicio de sesión exitoso', 'success');
                this.showMainApp();
                this.loadNotes();
            } else {
                this.showMessage(data.error || 'Error en el inicio de sesión', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
            console.error('Login error:', error);
        }
    }

    async register() {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!navigator.onLine) {
            this.showMessage('Sin conexión a internet. Por favor, revisa tu conexión.', 'error');
            return;
        }

        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'register',
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                localStorage.setItem('shadow_note_token', this.token);
                this.showMessage('Cuenta creada exitosamente', 'success');
                this.showMainApp();
                this.loadNotes();
            } else {
                this.showMessage(data.error || 'Error en el registro', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
            console.error('Register error:', error);
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('shadow_note_token');
        localStorage.removeItem('shadow_note_notes');
        localStorage.removeItem('shadow_note_pending');
        this.user = null;
        this.notes = [];
        this.currentNoteId = null;
        console.log('Sesión cerrada completamente');
        this.showAuthSection();
        this.showMessage('Sesión cerrada', 'info');
    }

    async loadNotes() {
        if (!navigator.onLine) {
            const offlineNotes = this.getOfflineNotes();
            if (offlineNotes.length > 0) {
                this.notes = offlineNotes;
                this.renderNotes();
                return;
            }
        }

        try {
            const response = await fetch('api/notes.php', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.notes = data.notes || [];
                this.setOfflineNotes(this.notes);
                this.renderNotes();
            } else if (response.status === 401) {
                this.logout();
            } else {
                this.showMessage('Error cargando notas', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión - Modo offline', 'info');
            console.error('Load notes error:', error);
            const offlineNotes = this.getOfflineNotes();
            if (offlineNotes.length > 0) {
                this.notes = offlineNotes;
                this.renderNotes();
            }
        }
    }

    renderNotes() {
        const notesList = document.getElementById('notes-list');
        notesList.innerHTML = '';

        if (this.notes.length === 0) {
            notesList.innerHTML = '<p class="empty-notes">No tienes notas aún. Crea tu primera nota.</p>';
            return;
        }

        this.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.onclick = () => this.editNote(note);

            const preview = note.body.length > 100 ? note.body.substring(0, 100) + '...' : note.body;

            noteElement.innerHTML = `
                <div class="note-title">${this.escapeHtml(note.title)}</div>
                <div class="note-preview">${this.escapeHtml(preview)}</div>
                <div class="note-date">Actualizado: ${new Date(note.updated_at).toLocaleDateString()}</div>
                <div class="note-actions">
                    <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); app.editNote(${note.id})">Editar</button>
                    <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); app.deleteNote(${note.id})">Eliminar</button>
                </div>
            `;

            notesList.appendChild(noteElement);
        });
    }

    showNoteEditor(note = null) {
        document.getElementById('note-editor').classList.remove('hidden');
        document.getElementById('notes-list').style.display = 'none';

        if (note) {
            this.currentNoteId = note.id;
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-body').value = note.body;
        } else {
            this.currentNoteId = null;
            document.getElementById('note-title').value = '';
            document.getElementById('note-body').value = '';
        }
    }

    hideNoteEditor() {
        document.getElementById('note-editor').classList.add('hidden');
        document.getElementById('notes-list').style.display = 'block';
        this.currentNoteId = null;
    }

    async saveNote() {
        const title = document.getElementById('note-title').value.trim();
        const body = document.getElementById('note-body').value.trim();

        if (!title || !body) {
            this.showMessage('Título y contenido son requeridos', 'error');
            return;
        }

        const noteData = { title, body };

        let noteSavedOffline = false;
        let noteId = this.currentNoteId;

        try {
            if (!navigator.onLine) {
                throw new Error('offline');
            }

            let response;
            if (noteId) {
                noteData.id = noteId;
                response = await fetch('api/notes.php', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(noteData)
                });
            } else {
                response = await fetch('api/notes.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(noteData)
                });
            }

            if (response.ok) {
                this.showMessage(noteId ? 'Nota actualizada' : 'Nota creada', 'success');
                this.hideNoteEditor();
                this.loadNotes();
                return;
            }

            throw new Error('server');
        } catch (error) {
            noteSavedOffline = true;
            if (noteId) {
                this.updateLocalNote(noteId, title, body);
                if (noteId > 0) {
                    this.queueOperation({ action: 'update', id: noteId, title, body });
                }
            } else {
                const localId = this.generateLocalId();
                const note = {
                    id: localId,
                    title,
                    body,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                this.notes.unshift(note);
                this.queueOperation({ action: 'create', tempId: localId, title, body });
            }

            this.setOfflineNotes(this.notes);
            this.renderNotes();
            this.hideNoteEditor();
            this.showMessage('Nota guardada localmente. Se sincronizará cuando vuelva la conexión.', 'info');
            console.error('Save note offline:', error);
        }
    }

    async deleteNote(noteId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            return;
        }

        try {
            if (!navigator.onLine) {
                throw new Error('offline');
            }

            const response = await fetch(`api/notes.php?id=${noteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showMessage('Nota eliminada', 'success');
                this.loadNotes();
                return;
            }

            throw new Error('server');
        } catch (error) {
            this.notes = this.notes.filter(note => note.id !== noteId);
            this.setOfflineNotes(this.notes);

            if (noteId > 0) {
                this.queueOperation({ action: 'delete', id: noteId });
            } else {
                this.cleanPendingTempOps(noteId);
            }

            this.renderNotes();
            this.showMessage('Nota eliminada localmente. Se sincronizará cuando vuelva la conexión.', 'info');
            console.error('Delete note offline:', error);
        }
    }

    editNote(noteOrId) {
        let note;
        if (typeof noteOrId === 'number') {
            note = this.notes.find(n => n.id === noteOrId);
        } else {
            note = noteOrId;
        }

        if (note) {
            this.showNoteEditor(note);
        } else {
            console.error('Nota no encontrada:', noteOrId);
            this.showMessage('Error: Nota no encontrada', 'error');
        }
    }

    async syncPendingOperations() {
        const pending = this.getPendingOperations();
        if (!navigator.onLine || !pending.length || !this.token) {
            console.log('Sync bloqueado - onLine:', navigator.onLine, 'pending:', pending.length, 'token:', !!this.token);
            return;
        }

        console.log('Iniciando sincronización de', pending.length, 'operaciones pendientes');
        
        let syncedCount = 0;
        let failedCount = 0;

        for (const op of pending) {
            try {
                if (op.action === 'create') {
                    const response = await fetch('api/notes.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.token}`
                        },
                        body: JSON.stringify({ title: op.title, body: op.body })
                    });

                    if (response.ok) {
                        this.removePendingOperation(op);
                        syncedCount++;
                        console.log('Operación CREATE sincronizada');
                    } else {
                        throw new Error(`sync create failed: ${response.status}`);
                    }
                } else if (op.action === 'update') {
                    if (op.id > 0) {
                        const response = await fetch('api/notes.php', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify({ id: op.id, title: op.title, body: op.body })
                        });
                        if (response.ok) {
                            this.removePendingOperation(op);
                            syncedCount++;
                            console.log('Operación UPDATE sincronizada');
                        } else {
                            throw new Error(`sync update failed: ${response.status}`);
                        }
                    }
                } else if (op.action === 'delete') {
                    if (op.id > 0) {
                        const response = await fetch(`api/notes.php?id=${op.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${this.token}`
                            }
                        });
                        if (response.ok) {
                            this.removePendingOperation(op);
                            syncedCount++;
                            console.log('Operación DELETE sincronizada');
                        } else {
                            throw new Error(`sync delete failed: ${response.status}`);
                        }
                    }
                }
            } catch (error) {
                failedCount++;
                console.error('Error sincronizando operación:', op, error);
                // Continúa con la siguiente operación en lugar de hacer break
            }
        }

        // Recargar notas del servidor para asegurar consistencia
        await this.loadNotes();

        // Mostrar mensaje de resultado
        if (syncedCount > 0) {
            this.showMessage(`${syncedCount} operación(es) sincronizada(s) exitosamente`, 'success');
        }
        if (failedCount > 0) {
            this.showMessage(`${failedCount} operación(es) no se sincronizaron. Serán reintentadas próximamente.`, 'warning');
        }
        
        console.log('Sincronización completada - Sincronizadas:', syncedCount, 'Fallidas:', failedCount);
    }

    queueOperation(operation) {
        const pending = this.getPendingOperations();
        pending.push(operation);
        localStorage.setItem('shadow_note_pending', JSON.stringify(pending));
    }

    removePendingOperation(operation) {
        const pending = this.getPendingOperations();
        const filtered = pending.filter(op => JSON.stringify(op) !== JSON.stringify(operation));
        localStorage.setItem('shadow_note_pending', JSON.stringify(filtered));
    }

    getPendingOperations() {
        return JSON.parse(localStorage.getItem('shadow_note_pending') || '[]');
    }

    cleanPendingTempOps(tempId) {
        const pending = this.getPendingOperations();
        const filtered = pending.filter(op => op.tempId !== tempId && op.id !== tempId);
        localStorage.setItem('shadow_note_pending', JSON.stringify(filtered));
    }

    getOfflineNotes() {
        return JSON.parse(localStorage.getItem('shadow_note_notes') || '[]');
    }

    setOfflineNotes(notes) {
        localStorage.setItem('shadow_note_notes', JSON.stringify(notes));
    }

    updateLocalNote(id, title, body) {
        this.notes = this.notes.map(note => {
            if (note.id === id) {
                return {
                    ...note,
                    title,
                    body,
                    updated_at: new Date().toISOString()
                };
            }
            return note;
        });
    }

    generateLocalId() {
        return Date.now() * -1;
    }

    showAuthSection() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        this.showLoginForm();
    }

    showMainApp() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        // Aquí podríamos mostrar el email del usuario si lo tuviéramos
    }

    showLoginForm() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        // Limpiar campos
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    }

    showRegisterForm() {
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
        // Limpiar campos
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('app-message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSyncStatus() {
        const pending = this.getPendingOperations();
        if (pending.length > 0 && !navigator.onLine) {
            this.showMessage(`${pending.length} operación(es) pendiente(s) de sincronización cuando vuelva la conexión`, 'info');
        }
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShadowNoteApp();
});