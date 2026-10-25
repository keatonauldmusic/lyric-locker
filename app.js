// Initial State
let data = { projects: [] };
let currentProjectId = null;
let currentSongId = null;

// Initialization
function init() {
    const saved = localStorage.getItem('lyricAppData');
    if (saved) {
        try {
            data = JSON.parse(saved);
        } catch (e) {
            console.error("Could not parse saved data.");
        }
    }
    renderProjects();
    if (data.projects.length > 0 && !currentProjectId) {
        selectProject(data.projects[0].id);
    } else {
        renderEditor();
    }
}

// Data Persistence
function saveData() {
    localStorage.setItem('lyricAppData', JSON.stringify(data));
}

// Generate Unique IDs
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// HTML Escaping to prevent UI breaks on weird characters
function escapeHTML(str) {
    return (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* --- Projects Logic --- */
function createProject() {
    const name = prompt("Enter Project/Album Name:");
    if (!name || name.trim() === "") return;

    const newProject = { id: generateId(), name: name.trim(), songs: [] };
    data.projects.push(newProject);
    saveData();
    selectProject(newProject.id);
    renderProjects();
}

function deleteProject(id, event) {
    event.stopPropagation();
    if (!confirm("Delete this project and all its songs? This cannot be undone.")) return;
    data.projects = data.projects.filter(p => p.id !== id);
    if (currentProjectId === id) {
        currentProjectId = null;
        currentSongId = null;
    }
    saveData();
    renderProjects();
    if (data.projects.length > 0) selectProject(data.projects[0].id);
    else { renderSongs(); renderEditor(); }
}

function selectProject(id) {
    currentProjectId = id;
    currentSongId = null;
    document.getElementById('newSongBtn').disabled = false;
    renderProjects();
    renderSongs();

    const project = data.projects.find(p => p.id === id);
    document.getElementById("header-name").innerHTML=project.name;
    if (project && project.songs.length > 0) {
        selectSong(project.songs[0].id);
    } else {
        renderEditor();
    }
}

/* --- Songs Logic --- */
function createSong() {
    if (!currentProjectId) return;
    const title = prompt("Enter Song Title:");
    if (!title || title.trim() === "") return;

    const newSong = { id: generateId(), title: title.trim(), key: '', bpm: '', genre: '', lyrics: '' };
    const project = data.projects.find(p => p.id === currentProjectId);
    project.songs.push(newSong);

    saveData();
    selectSong(newSong.id);
    renderSongs();
}

function deleteSong(id, event) {
    event.stopPropagation();
    if (!confirm("Delete this song?")) return;

    const project = data.projects.find(p => p.id === currentProjectId);
    project.songs = project.songs.filter(s => s.id !== id);

    if (currentSongId === id) currentSongId = null;

    saveData();
    renderSongs();
    if (project.songs.length > 0) selectSong(project.songs[0].id);
    else renderEditor();
}

function selectSong(id) {
    currentSongId = id;
    renderSongs();
    renderEditor();
}

function updateSong(field, value) {
    if (!currentProjectId || !currentSongId) return;
    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);

    song[field] = value;
    saveData();

    if (field === 'title') renderSongs(); // Update sidebar immediately
}

/* --- UI Rendering --- */
function renderProjects() {
    const list = document.getElementById('projectsList');
    list.innerHTML = '';
    data.projects.forEach(p => {
        const li = document.createElement('li');
        li.className = p.id === currentProjectId ? 'active' : '';
        li.onclick = () => selectProject(p.id);
        li.innerHTML = `
            <span>${escapeHTML(p.name)}</span>
            <button class="delete-item-btn" onclick="deleteProject('${p.id}', event)">✕</button>
        `;
        list.appendChild(li);
    });
    if (data.projects.length === 0) document.getElementById('newSongBtn').disabled = true;

    //console.log("Rendering Projects")
}

function renderSongs() {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    if (!currentProjectId) return;

    const project = data.projects.find(p => p.id === currentProjectId);
    project.songs.forEach(s => {
        const li = document.createElement('li');
        li.className = s.id === currentSongId ? 'active' : '';
        li.className = li.className + " item"
        li.onclick = () => selectSong(s.id);
        li.draggable = true;
        li.id = s.id;
        li.innerHTML = `
            <span>${escapeHTML(s.title)}</span>
            <button class="delete-item-btn" onclick="deleteSong('${s.id}', event)">✕</button>
        `;
        list.appendChild(li);
    });

    //console.log("Rendering Songs")
}

function renderEditor() {
    const panel = document.getElementById('editorPanel');
    if (!currentProjectId || !currentSongId) {
        panel.innerHTML = '<div class="empty-state">Select or create a song to begin writing.</div>';
        return;
    }

    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);

    panel.innerHTML = `
        <div class="editor-header">
            <input type="text" class="title-input" value="${escapeHTML(song.title)}" oninput="updateSong('title', this.value)" placeholder="Song Title">
        </div>
        <div class="metadata-row">
            <div class="meta-field">
                <label>Key</label>
                <input type="text" value="${escapeHTML(song.key)}" oninput="updateSong('key', this.value)" placeholder="e.g. C# Minor">
            </div>
            <div class="meta-field">
                <label>BPM</label>
                <input type="number" value="${escapeHTML(song.bpm)}" oninput="updateSong('bpm', this.value)" placeholder="120">
            </div>
            <div class="meta-field">
                <label>Genre</label>
                <input type="text" value="${escapeHTML(song.genre)}" oninput="updateSong('genre', this.value)" placeholder="Alt Rock">
            </div>
        </div>
        <textarea class="lyrics-input" oninput="updateSong('lyrics', this.value)" placeholder="Start writing lyrics here...">${escapeHTML(song.lyrics)}</textarea>
    `;
}

/* --- Import/Export (File I/O) --- */
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `lyriclab_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData && importedData.projects) {
                data = importedData;
                saveData();
                currentProjectId = null;
                currentSongId = null;
                init();
                alert("Projects imported successfully.");
            } else {
                alert("Invalid backup file format.");
            }
        } catch (err) {
            alert("Error reading file.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input so same file can be uploaded again if needed
}

class CustomPrompt {
    constructor() {
        this.dialog = document.getElementById('custom-prompt-modal');
        this.form = document.getElementById('prompt-form');
        this.titleText = document.getElementById('prompt-title');
        this.messageText = document.getElementById('prompt-message');
        this.inputField = document.getElementById('prompt-input');
        this.cancelBtn = document.getElementById('prompt-cancel-btn');
        this.errorSpan = document.getElementById('input-error');

        this.resolvePromise = null;
    }

    /**
     * Triggers the custom prompt display asynchronously.
     * @param {string} title - Heading for the modal
     * @param {string} message - Explanatory message text
     * @param {string} defaultValue - Initial text placeholder inside the input
     * @returns {Promise<string|null>} - Returns the string value on confirm, or null on cancel
     */
    show(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;

            // Set configurations dynamically
            this.titleText.textContent = title;
            this.messageText.textContent = message;
            this.inputField.value = defaultValue;

            // Clear prior errors and show modal
            this.errorSpan.style.display = 'none';
            this.inputField.style.borderColor = '';
            this.dialog.showModal();

            // Auto focus input field safely
            setTimeout(() => this.inputField.focus(), 50);

            // Bind contextual instance handlers
            this.cancelBtn.onclick = () => this.handleClose(null);
            this.form.onsubmit = (e) => this.handleSubmit(e);
            this.dialog.oncancel = () => this.handleClose(null); // Catches Escape key actions
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        const value = this.inputField.value.trim();

        if (!value) {
            this.errorSpan.style.display = 'block';
            this.inputField.style.borderColor = 'var(--accent-red)';
            return;
        }

        this.handleClose(value);
    }

    handleClose(value) {
        this.dialog.close();
        if (this.resolvePromise) {
            this.resolvePromise(value);
            this.resolvePromise = null; // Prevent memory leak issues
        }
    }
}

function showsettings() {
    document.getElementById("settings-modal").showModal();

    const lightmode = document.getElementById("theme-checkbox");

    if (localStorage.getItem('data-light-mode') == "true") {
        lightmode.checked = true;
    }
    else {
        lightmode.checked = false;
    }

    document.getElementById(localStorage.getItem("data-theme")).checked = true;

    const monospace = document.getElementById("monospace-checkbox");

    if (localStorage.getItem('data-monospace-editor') == "true") {
        monospace.checked = true;
    }
    else {
        monospace.checked = false;
    }

}

function closeSettings() {
    document.getElementById("settings-modal").close();
}

function saveSettings() {
    const currentTheme = document.querySelector('input[name="theme-select"]:checked').id
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('data-theme', currentTheme);

    const monospace = document.getElementById("monospace-checkbox");
    if (monospace.checked) {
        document.documentElement.setAttribute('data-monospace-editor', "true");
        localStorage.setItem('data-monospace-editor', "true");
    }
    else {
        document.documentElement.setAttribute('data-monospace-editor', "false");
        localStorage.setItem('data-monospace-editor', "false");
    }

    const lighttheme = document.getElementById("theme-checkbox");
    if (lighttheme.checked) {
        document.documentElement.setAttribute('data-light-mode', "true");
        localStorage.setItem('data-light-mode', "true");
    }
    else {
        document.documentElement.setAttribute('data-light-mode', "false");
        localStorage.setItem('data-light-mode', "false");
    }


    if (currentSongId !== null) {
        renderEditor();
    }

    document.getElementById("settings-modal").close();
}

function loadSettings() {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('data-theme'));
    document.documentElement.setAttribute('data-light-mode', localStorage.getItem('data-light-mode'));
    document.documentElement.setAttribute('data-monospace-editor', localStorage.getItem('data-monospace-editor'));
}

// --- Application Logic Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    const promptSystem = new CustomPrompt();
    const projectBtn = document.getElementById('project-wizard-btn');
    const songBtn = document.getElementById('newSongBtn');

    projectBtn.addEventListener('click', async () => {
        // Invoke the custom dialog asynchronously like a standard native prompt
        const username = await promptSystem.show(
            "Create New Project",
            "Enter your new Telperion Lyric Locker project name below:",
            "New Album"
        );

        // Process outputs natively
        if (username !== null) {
            const newProject = { id: generateId(), name: username.trim(), songs: [] };
            data.projects.push(newProject);
            saveData();
            selectProject(newProject.id);
            renderProjects();
        } else {
            return;
        }
    });

    songBtn.addEventListener('click', async () => {
        if (!currentProjectId) return;
        // Invoke the custom dialog asynchronously like a standard native prompt
        const username = await promptSystem.show(
            "Create New Song",
            'Name your new song in ' + data.projects.find(p => p.id === currentProjectId).name + ":",
            "New Song"
        );

        // Process outputs natively
        if (username !== null) {
            const newSong = { id: generateId(), title: username.trim(), key: '', bpm: '', genre: '', lyrics: '' };
            const project = data.projects.find(p => p.id === currentProjectId);
            project.songs.push(newSong);

            saveData();
            selectSong(newSong.id);
            renderSongs();
        } else {
            return;
        }
    });

});


const list = document.querySelector('#songsList');

// 1. Monitor when dragging starts and ends
list.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('item')) {
        e.target.classList.add('dragging');
    }
});

list.addEventListener('dragend', (e) => {
    const draggingItem = document.querySelector('.dragging');
    // Get all items except the one currently being dragged
    const siblings = [...list.querySelectorAll('.item:not(.dragging)')];

    // Find the sibling item that our mouse cursor is directly above
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        // Check if the cursor is past the halfway point of the vertical element
        return e.clientY <= box.top + box.height / 2;
    });

    // Insert the dragging item directly before the found sibling
    if (nextSibling) {
        list.insertBefore(draggingItem, nextSibling);

        const project = data.projects.find(p => p.id === currentProjectId);

        const song = project.songs.splice(project.songs.findIndex(s => s.id === draggingItem.id), 1);
        project.songs.splice(project.songs.findIndex(s => s.id === nextSibling.id), 0, song[0]);
    } else {
         // If we're at the very bottom, append to the end of the list
        list.appendChild(draggingItem);

        const project = data.projects.find(p => p.id === currentProjectId);
        const song = project.songs.splice(project.songs.findIndex(s => s.id === draggingItem.id), 1);

        project.songs.push(song[0]);
   }
   saveData();
    renderSongs();

    if (e.target.classList.contains('item')) {
        e.target.classList.remove('dragging');
    }
});

// 2. Determine where to insert the element while dragging over the list
list.addEventListener('dragover', (e) => {
    e.preventDefault(); // Required to allow a drop event

    const draggingItem = document.querySelector('.dragging');
    // Get all items except the one currently being dragged
    const siblings = [...list.querySelectorAll('.item:not(.dragging)')];

    for (const sib of siblings){
        if (sib.classList.contains("drag-hover")){
            sib.classList.remove("drag-hover")
        }
        
    }

    // Find the sibling item that our mouse cursor is directly above
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        // Check if the cursor is past the halfway point of the vertical element
        return e.clientY <= box.top + box.height / 2;
    });

    // Insert the dragging item directly before the found sibling
    if (nextSibling) {
        nextSibling.classList.add('drag-hover');
    } else {
        return
    }

});



// Boot the app
window.onload = init;