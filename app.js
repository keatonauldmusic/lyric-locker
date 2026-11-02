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
    renderComments();
    renderStats();
    renderTodos();
    loadAppVersionData();

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

    const newProject = { id: generateId(), name: name.trim(), songs: [], notes: (name.trim() + " - created on " + getTime()), todo: [] };
    console.log(newProject.notes)
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
    renderComments();
    renderStats();
    renderTodos();
    if (data.projects.length > 0) selectProject(data.projects[0].id);
    else { renderSongs(); renderEditor(); }
}

function deleteComment(id, event) {
    event.stopPropagation();

    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);

    song.comments = song.comments.filter(p => p.id !== id);

    saveData();
    renderComments();
    renderStats();
}

function selectProject(id) {
    currentProjectId = id;
    currentSongId = null;
    document.getElementById('newSongBtn').disabled = false;
    renderProjects();
    renderSongs();

    const project = data.projects.find(p => p.id === id);
    document.getElementById("header-name").innerHTML = project.name;
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
    renderComments();
    renderStats();
    renderTodos();
}

function deleteSong(id, event) {
    event.stopPropagation();
    if (!confirm("Delete this song?")) return;

    const project = data.projects.find(p => p.id === currentProjectId);
    project.songs = project.songs.filter(s => s.id !== id);

    if (currentSongId === id) currentSongId = null;

    saveData();
    renderSongs();
    renderComments();
    renderStats();
    renderTodos();
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
    renderStats();
}


function updateNotes() {
    if (!currentProjectId) return;

    const project = data.projects.find(p => p.id === currentProjectId);

    const notes = document.getElementById('notes-textarea');

    project.notes = notes.value;
    saveData();
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
            <button class="delete-item-btn" onclick="deleteProject('${p.id}', event)"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        list.appendChild(li);
    });
    if (data.projects.length === 0) document.getElementById('newSongBtn').disabled = true;

    renderNotes();

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
            <button class="delete-item-btn" onclick="deleteSong('${s.id}', event)"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        list.appendChild(li);
    });

    //console.log("Rendering Songs")
}

function renderNotes() {
    const textarea = document.getElementById("notes-textarea");
    if (!currentProjectId) {
        textarea.value = '';
        textarea.disabled = true;
        return
    }
    else {
        textarea.disabled = false
        const project = data.projects.find(p => p.id === currentProjectId);


        textarea.value = project.notes;
    }
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
    renderComments();
    renderStats();
    renderTodos();
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

const appVersionData = {
    version:"1.0.0",
    changelog:[
        {
            date:"11/1/2026",
            version:"1.0.0",
            overview:"First deployed version of the app.",
            bullets:["Create and edit projects and songs","Local storage for settings and projects","Option for json export and import","Dark and Light theme with adjustable theme colors","Rhyme search engine","Project notes and song comments","Task tracker"]
        }
    ]
}

async function loadAppVersionData() {
/*   try {
    // Relative path to your local JSON file
    const response = await fetch('./data.json'); 
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const d = await response.json();
    console.log(d); // Your JSON object is ready here
  } catch (error) {
    console.error("Could not load JSON file:", error);
  } */

    const version=document.getElementById('app-version');
    version.innerHTML=appVersionData.version;
    const list=document.getElementById('changelog-list')
    appVersionData.changelog.forEach(p => {
        // console.log(p);
        const li = document.createElement('li');
        const bullets=document.createElement('ul');
        const info=document.createElement('div')
        p.bullets.forEach(b=>{
            const bul=document.createElement('li');
            bul.innerHTML=b;
            bullets.appendChild(bul);
        })
        li.classList.add("changelog-item");
        info.innerHTML = `
        <h4 class="changelog-version">${p.version}</h4>
        <p class="changelog-date">${p.date}</p>
        <p class="changelog-overview">${p.overview}</p>
        `;
        li.appendChild(info);
        li.appendChild(bullets);

        list.appendChild(li);
    });
}

const wordCount = (text) => text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

function renderStats(){
    // PROJECT STATS FIRST
    if (!currentProjectId) return;
    const project = data.projects.find(p => p.id === currentProjectId);
    songcount=project.songs.length;
    const songcounter=document.getElementById("song-count");
    songcounter.innerHTML=songcount;

    var averagewordcount=0
    project.songs.forEach(s=>{
        averagewordcount+=wordCount(s.lyrics)
    })
    averagewordcount=Math.round(averagewordcount/project.songs.length);
    const averagewordcounter=document.getElementById("average-word-count");
    averagewordcounter.innerHTML=averagewordcount;



    // ONLY SONG STATS FROM HERE ON OUT
    // word count
    if(!currentSongId) return;
    const song = project.songs.find(s => s.id === currentSongId);
    words=wordCount(song.lyrics);
    const wordcounter=document.getElementById("word-count");
    wordcounter.innerHTML=words;
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

    const animations = document.getElementById("animations-checkbox");

    if (localStorage.getItem('data-animations') == "true") {
        animations.checked = true;
    }
    else {
        animations.checked = false;
    }

    document.getElementById(localStorage.getItem("data-theme")).checked = true;

    const monospace = document.getElementById("monospace-checkbox");

    if (localStorage.getItem('data-monospace-editor') == "true") {
        monospace.checked = true;
    }
    else {
        monospace.checked = false;
    }

    const hidetodo = document.getElementById("todo-hide-checkbox");

    if (localStorage.getItem('data-hide-todos') == "true") {
        hidetodo.checked = true;
    }
    else {
        hidetodo.checked = false;
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

    const animations = document.getElementById("animations-checkbox");
    if (animations.checked) {
        document.documentElement.setAttribute('data-animations', "true");
        localStorage.setItem('data-animations', "true");
    }
    else {
        document.documentElement.setAttribute('data-animations', "false");
        localStorage.setItem('data-animations', "false");
    }

    const hidetodo = document.getElementById("todo-hide-checkbox");
    if (hidetodo.checked) {
        document.documentElement.setAttribute('data-hide-todos', "true");
        localStorage.setItem('data-hide-todos', "true");
    }
    else {
        document.documentElement.setAttribute('data-hide-todos', "false");
        localStorage.setItem('data-hide-todos', "false");
    }


    if (currentSongId !== null) {
        renderEditor();
    }

    document.getElementById("settings-modal").close();
}

let styleSettings = [['data-theme', 'theme-blue'], ['data-light-mode', 'false'], ['data-monospace-editor', 'true'], ['data-animations', 'true'], ['data-hide-todos','false']]

function loadSettings() {
    var variable;
    for (setting in styleSettings) {
        variable = localStorage.getItem(styleSettings[setting][0]);
        if (variable) {
            document.documentElement.setAttribute(styleSettings[setting][0], variable);
        }
        else {
            document.documentElement.setAttribute(styleSettings[setting][0], styleSettings[setting][1])
        }
    }
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
            const newProject = { id: generateId(), name: username.trim(), songs: [], notes: username.trim() + " - created on " + new Date().toISOString(), todo: [] };
            data.projects.push(newProject);
            saveData();
            selectProject(newProject.id);
            renderProjects();
            renderTodos();
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
            const newSong = { id: generateId(), title: username.trim(), key: '', bpm: '', genre: '', lyrics: '', comments: [], todo: [] };
            const project = data.projects.find(p => p.id === currentProjectId);
            project.songs.push(newSong);

            saveData();
            selectSong(newSong.id);
            renderSongs();
            renderComments();
            renderStats();
            renderTodos();
        } else {
            return;
        }
    });

});


async function editComment(id, event) {
    event.stopPropagation();
    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);
    const comment = song.comments.find(s => s.id === id);
    const promptSystem = new CustomPrompt();

    const edited = await promptSystem.show(
        "Edit Comment",
        "Enter your revised comment below:",
        comment.text
    );

    // Process outputs natively
    if (edited !== null) {
        const newComment = { id: id, text: edited, date: comment.date };
        const index = song.comments.findIndex(s => s.id === id);
        song.comments.splice(index, 1, newComment);

    } else {
        return;
    }

    saveData();
    renderComments();
    renderStats();
}

function renderComments() {
    const list = document.getElementById('comments-list');
    const input = document.getElementById('comment-input');
    list.innerHTML = '';
    if (currentSongId === null) {
        input.disabled = true;
        return;
    }
    input.disabled = false;
    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);
    song.comments.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class='comment-text'>
            <span>${escapeHTML(p.date)}</span>
            <p>${p.text}</p>
            </div>
            <button class="delete-item-btn" onclick="editComment('${p.id}', event)"><i class="fa-solid fa-pen"></i></button>
            <button class="delete-item-btn" onclick="deleteComment('${p.id}', event)"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        list.appendChild(li);
    });
}

function completeProjectTodo(id) {
    if (currentProjectId == null) { return; };
    const project = data.projects.find(p => p.id === currentProjectId);
    const todo = project.todo.find(p => p.id === id);
    if (todo.completed) {
        todo.completed = false
    }
    else {
        todo.completed = true
    }
    saveData();
    renderTodos();
}
function completeSongTodo(id) {
    if (currentSongId == null) { return; };
    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);
    const todo = song.todo.find(p => p.id === id);
    if (todo.completed) {
        todo.completed = false
    }
    else {
        todo.completed = true
    }
    saveData();
    renderTodos();
}

function deleteProjectTodo(id){
    if (currentProjectId == null) { return; };
    const project = data.projects.find(p => p.id === currentProjectId);

    project.todo = project.todo.filter(p => p.id !== id);

    saveData();
    renderTodos();
}

function deleteSongTodo(id){
    if (currentSongId == null) { return; };
    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);

    song.todo = song.todo.filter(p => p.id !== id);

    saveData();
    renderTodos();
}

function renderTodos() {
    //project todos
    const project = data.projects.find(p => p.id === currentProjectId);
    const projectlist = document.getElementById('project-todo-list');
    const projectbutton = document.getElementById('project-todo-button');
    projectlist.innerHTML = '';
    if (currentProjectId === null) {
        projectbutton.disabled = true;
        return;
    }
    projectbutton.disabled = false;
    project.todo.forEach(p => {
        const li = document.createElement('li');
        li.classList.add('todo-item');
        if (p.completed) {
            li.classList.add('completed')
        }
        li.innerHTML = `
            <div onclick=completeProjectTodo('${p.id}') class='todo-text'>
            <p>${p.text}</p>
            </div>
            <button class="delete-item-btn" onclick="deleteProjectTodo('${p.id}', event)"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        projectlist.appendChild(li);
    });


    //song todos
    const songlist = document.getElementById('song-todo-list');
    const songbutton = document.getElementById('song-todo-button');
    songlist.innerHTML = '';
    if (currentSongId === null) {
        songbutton.disabled = true;
        return;
    }
    const song = project.songs.find(s => s.id === currentSongId);
    songbutton.disabled = false;
    song.todo.forEach(p => {
        const li = document.createElement('li');
        if (p.completed == true) {
            li.classList.add('completed')
        }
        li.innerHTML = `
            <div onclick=completeSongTodo('${p.id}') class='todo-text'>
            <p>${p.text}</p>
            </div>
            <button class="delete-item-btn" onclick="deleteSongTodo('${p.id}', event)"><i class="fa-solid fa-circle-xmark"></i></button>
        `;
        songlist.appendChild(li);
    });
}

async function newProjectTodo() {
    if (currentProjectId == null) {
        return;
    }

    const promptSystem = new CustomPrompt();

    const project = data.projects.find(p => p.id === currentProjectId);

    const todo = await promptSystem.show(
        "New Project Task",
        "Enter your task below:",
        "Add a song..."
    );

    // Process outputs natively
    if (todo !== null) {
        const newTodo = { id: generateId(), text: todo, completed: false };
        project.todo.push(newTodo);

    } else {
        return;
    }

    saveData();
    renderTodos();
}

async function newSongTodo() {
    if (currentSongId == null) {
        return;
    }

    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);
    const promptSystem = new CustomPrompt();

    const todo = await promptSystem.show(
        "New Song Task",
        "Enter your task below:",
        "Add a verse..."
    );

    // Process outputs natively
    if (todo !== null) {
        const newTodo = { id: generateId(), text: todo, completed: false };
        song.todo.push(newTodo);

    } else {
        return;
    }

    saveData();
    renderTodos();
}

function postComment() {
    const input = document.getElementById('comment-input');
    if (!input.value) { return };
    const newComment = { id: generateId(), text: input.value, date: new Date().toISOString().split('T')[0] };
    const project = data.projects.find(p => p.id === currentProjectId);
    const song = project.songs.find(s => s.id === currentSongId);
    song.comments.push(newComment);

    input.value = '';

    saveData();
    renderComments();
    renderStats();
}


const list = document.querySelector('#songsList');

// 1. Monitor when dragging starts and ends
list.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('item')) {
        e.target.classList.add('dragging');
    }
});

list.addEventListener('dragend', (e) => {
    e.preventDefault();
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

    for (const sib of siblings) {
        if (sib.classList.contains("drag-hover")) {
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

let panels = {
    projects: {
        icon: "projects-panel-icon",
        panels: ["projects-panel", "songs-panel"]
    },
    rhymes: {
        icon: "rhymes-panel-icon",
        panels: ["rhymes-panel"]
    },
    notes: {
        icon: "notes-panel-icon",
        panels: ["notes-panel"]
    },
    comments: {
        icon: "comments-panel-icon",
        panels: ["comments-panel"]
    },
    todo: {
        icon: "todo-panel-icon",
        panels: ["todo-panel"]
    },
    stats: {
        icon: "stats-panel-icon",
        panels: ["stats-panel"]
    },
    info: {
        icon: "info-panel-icon",
        panels: ["info-panel"]
    },
}

function handlePanel(panelName) {
    const panel = panels[panelName];
    const icon = document.getElementById(panel.icon)

    //if we're closing the active panel, simply remove its active tab and hide the panels
    if (icon.classList.contains("active")) {
        icon.classList.remove("active");
        for (item in panel.panels) {
            document.getElementById(panel.panels[item]).style.display = "none"
        }
    }
    // otherwise we need to deactivate any other panels and then fully activate the right one
    else {
        for (item in panels) {
            document.getElementById(panels[item].icon).classList.remove("active");
            for (i in panels[item].panels) {
                document.getElementById(panels[item].panels[i]).style.display = "none"
            }
        }

        icon.classList.add("active");
        for (item in panel.panels) {
            document.getElementById(panel.panels[item]).style.display = "block"
        }
    }
}


async function findRhymes() {
    const word = document.getElementById('rhyme-input').value.trim();
    const resultsContainer = document.getElementById('rhyme-results');
    resultsContainer.innerHTML = 'Searching...';

    if (!word) {
        resultsContainer.innerHTML = 'Please enter a word.';
        return;
    }

    try {
        // Datamuse API endpoint for rhymes (rel_rhy)
        const response = await fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=30`);
        const data = await response.json();

        resultsContainer.innerHTML = '';

        if (data.length === 0) {
            resultsContainer.innerHTML = 'No rhymes found.';
            return;
        }

        // Loop through results and create stylish tags
        data.forEach(item => {
            const tag = document.createElement('span');
            tag.innerText = item.word;
            tag.classList.add("rhyme-pill");

            // Optional: Click a rhyming word to copy it or paste it into your lyrics
            tag.title = `Syllables: ${item.numSyllables}`;
            tag.onclick = () => {
                navigator.clipboard.writeText(item.word);
                tag.style.background = 'var(--accent)';
                setTimeout(() => tag.style.background = 'var(--bg-dark)', 500);
            };

            resultsContainer.appendChild(tag);
        });

    } catch (error) {
        resultsContainer.innerHTML = 'Error fetching rhymes. Check your connection.';
    }
}

handlePanel("projects")

// Boot the app
window.onload = init;