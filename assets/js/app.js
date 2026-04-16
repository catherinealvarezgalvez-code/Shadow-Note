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
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registrado'))
                .catch(err => console.log('Error registrando SW:', err));
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
        window.addEventListener('online', () => this.showMessage('Conexión restaurada', 'success'));
        window.addEventListener('offline', () => this.showMessage('Modo offline activado', 'info'));
    }

    checkAuth() {
        if (this.token) {
            // Verificar si el token es válido
            this.verifyToken().then(valid => {
                if (valid) {
                    this.showMainApp();
                    this.loadNotes();
                } else {
                    this.logout();
                }
            });
        } else {
            this.showAuthSection();
        }
    }

    async verifyToken() {
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
        this.user = null;
        this.notes = [];
        this.currentNoteId = null;
        this.showAuthSection();
        this.showMessage('Sesión cerrada', 'info');
    }

    async loadNotes() {
        try {
            const response = await fetch('api/notes.php', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.notes = data.notes || [];
                this.renderNotes();
            } else if (response.status === 401) {
                this.logout();
            } else {
                this.showMessage('Error cargando notas', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión - Modo offline', 'info');
            console.error('Load notes error:', error);
            // En offline, podríamos cargar desde localStorage o IndexedDB
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

        try {
            let response;
            const noteData = { title, body };

            if (this.currentNoteId) {
                // Actualizar nota existente
                noteData.id = this.currentNoteId;
                response = await fetch('api/notes.php', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(noteData)
                });
            } else {
                // Crear nueva nota
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
                this.showMessage(this.currentNoteId ? 'Nota actualizada' : 'Nota creada', 'success');
                this.hideNoteEditor();
                this.loadNotes();
            } else {
                this.showMessage('Error guardando la nota', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
            console.error('Save note error:', error);
        }
    }

    async deleteNote(noteId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            return;
        }

        try {
            const response = await fetch(`api/notes.php?id=${noteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showMessage('Nota eliminada', 'success');
                this.loadNotes();
            } else {
                this.showMessage('Error eliminando la nota', 'error');
            }
        } catch (error) {
            this.showMessage('Error de conexión', 'error');
            console.error('Delete note error:', error);
        }
    }

    editNote(noteOrId) {
        let note;
        if (typeof noteOrId === 'number') {
            // Si es un ID, buscar la nota completa
            note = this.notes.find(n => n.id === noteOrId);
        } else {
            // Si es el objeto note completo
            note = noteOrId;
        }

        if (note) {
            this.showNoteEditor(note);
        } else {
            console.error('Nota no encontrada:', noteOrId);
            this.showMessage('Error: Nota no encontrada', 'error');
        }
    }

    showAuthSection() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        // Aquí podríamos mostrar el email del usuario si lo tuviéramos
    }

    showLoginForm() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    }

    showRegisterForm() {
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
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
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShadowNoteApp();
});