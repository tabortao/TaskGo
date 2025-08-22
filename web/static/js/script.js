// --- Tag Color Generation ---
const tagColorCache = {};
const colorPalette = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#f1c40f', '#e67e22', '#e74c3c', '#7f8c8d', '#16a085',
    '#27ae60', '#2980b9', '#8e44ad', '#c0392b'
];

function getTagColor(tag) {
    if (tagColorCache[tag]) {
        return tagColorCache[tag];
    }
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Ensure 32bit integer
    }
    const index = Math.abs(hash % colorPalette.length);
    const color = colorPalette[index];
    tagColorCache[tag] = color;
    return color;
}
// --- End Tag Color Generation ---

// Global state to hold all tasks and the current filter
let allTasks = [];
let currentTagFilter = null;
let currentSearchQuery = '';
let completedTasksToShow = 10;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        showApp();
    } else {
        showAuth();
    }

    // Auth view switching
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('register-view').style.display = 'block';
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-view').style.display = 'none';
        document.getElementById('login-view').style.display = 'block';
    });

    // Auth form submissions
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-link').addEventListener('click', handleLogout);

    // User profile interactions
    document.getElementById('user-profile').addEventListener('click', () => {
        const menu = document.getElementById('user-menu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    // Settings Modal
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = settingsModal.querySelector('.close-btn');

    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        settingsModal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target == settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    document.getElementById('avatar-form').addEventListener('submit', handleAvatarUpload);
    document.getElementById('password-form').addEventListener('submit', handlePasswordChange);

    // Task form submission
    document.getElementById('task-form').addEventListener('submit', handleCreateTask);

    // Search input listener
    document.getElementById('search-input').addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        renderTasks();
    });

    // Show more button listener
    document.getElementById('show-more-btn').addEventListener('click', () => {
        completedTasksToShow += 10;
        renderTasks();
    });

    // Sidebar toggle listener
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');

    // Check for saved state or mobile view
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
    } else if (localStorage.getItem('sidebar-collapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    });

    // Mobile tags toggle listener
    const mobileTagsToggleBtn = document.getElementById('mobile-tags-toggle-btn');
    mobileTagsToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // --- Collapsible Task Sections Logic ---
    const todoSection = document.getElementById('todo-section');
    const completedSection = document.getElementById('completed-section');

    // Set initial states based on localStorage or defaults
    if (localStorage.getItem('todo-collapsed') === 'true') {
        todoSection.classList.add('collapsed');
    } else {
        todoSection.classList.remove('collapsed');
    }

    if (localStorage.getItem('completed-collapsed') === 'false') {
        completedSection.classList.remove('collapsed');
    } else {
        completedSection.classList.add('collapsed');
    }

    todoSection.querySelector('.task-section-header').addEventListener('click', () => {
        todoSection.classList.toggle('collapsed');
        localStorage.setItem('todo-collapsed', todoSection.classList.contains('collapsed'));
    });

    completedSection.querySelector('.task-section-header').addEventListener('click', () => {
        completedSection.classList.toggle('collapsed');
        localStorage.setItem('completed-collapsed', completedSection.classList.contains('collapsed'));
    });
    // --- End Collapsible Task Sections Logic ---

    // --- Tag Autocomplete Logic ---
    const taskInput = document.getElementById('task-input');
    const autocompleteContainer = document.getElementById('tag-autocomplete-container');

    taskInput.addEventListener('input', () => {
        const cursorPos = taskInput.selectionStart;
        const textBeforeCursor = taskInput.value.substring(0, cursorPos);
        const tagMatch = textBeforeCursor.match(/#([^\s#]*)$/);

        if (tagMatch) {
            const currentTagQuery = tagMatch[1];
            const allTags = [...new Set(allTasks.flatMap(task => task.tags ? task.tags.split(',') : []))].filter(Boolean);
            const matchingTags = allTags.filter(tag => tag.toLowerCase().startsWith(currentTagQuery.toLowerCase()));
            
            showAutocomplete(matchingTags, currentTagQuery);
        } else {
            hideAutocomplete();
        }
    });

    function showAutocomplete(tags, query) {
        if (tags.length === 0) {
            hideAutocomplete();
            return;
        }
        autocompleteContainer.innerHTML = '';
        tags.forEach(tag => {
            const div = document.createElement('div');
            div.textContent = `#${tag}`;
            div.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent input from losing focus
                const textBeforeCursor = taskInput.value.substring(0, taskInput.selectionStart);
                const textAfterCursor = taskInput.value.substring(taskInput.selectionStart);
                
                const newTextBefore = textBeforeCursor.replace(/#([^\s#]*)$/, `#${tag} `);
                
                taskInput.value = newTextBefore + textAfterCursor;
                hideAutocomplete();
                taskInput.focus();
            });
            autocompleteContainer.appendChild(div);
        });
        autocompleteContainer.style.display = 'block';
    }

    function hideAutocomplete() {
        autocompleteContainer.style.display = 'none';
    }

    taskInput.addEventListener('blur', () => {
        // Delay hiding to allow click/mousedown event to register
        setTimeout(hideAutocomplete, 150);
    });
    // --- End Tag Autocomplete Logic ---
});

function showAuth() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    loadUser();
    loadTasks();
}

async function loadUser() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        const { data } = await res.json();
        document.getElementById('username-display').textContent = data.username;
        const avatar = document.getElementById('user-avatar');
        if (data.avatar_url) {
            avatar.src = data.avatar_url;
        } else {
            avatar.src = '/static/icons/avatar.png';
        }
    } else {
        handleLogout(); // Token might be expired
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        alert('Registration successful! Please login.');
        document.getElementById('show-login').click();
    } else {
        const { error } = await res.json();
        alert(`Error: ${error}`);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        const { token, user } = await res.json();
        localStorage.setItem('token', token);
        document.getElementById('username-display').textContent = user.username;
        const avatar = document.getElementById('user-avatar');
        if (user.avatar_url) {
            avatar.src = user.avatar_url;
        } else {
            avatar.src = '/static/icons/avatar.png';
        }
        showApp();
    } else {
        alert('Invalid credentials');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    allTasks = [];
    currentTagFilter = null;
    showAuth();
}

async function handleAvatarUpload(e) {
    e.preventDefault();
    const avatarInput = document.getElementById('avatar-input');
    const file = avatarInput.files[0];

    if (!file) {
        alert('Please select a file.');
        return;
    }

    if (file.size > 1 * 1024 * 1024) { // 1MB
        alert('File size must be less than 1MB.');
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (res.ok) {
        const { data } = await res.json();
        document.getElementById('user-avatar').src = data.avatar_url;
        alert('Avatar updated successfully!');
        document.getElementById('settings-modal').style.display = 'none';
    } else {
        const { error } = await res.json();
        alert(`Error: ${error}`);
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    const token = localStorage.getItem('token');
    const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });

    if (res.ok) {
        alert('Password updated successfully!');
        document.getElementById('password-form').reset();
        document.getElementById('settings-modal').style.display = 'none';
    } else {
        const { error } = await res.json();
        alert(`Error: ${error}`);
    }
}


async function loadTasks() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        const { data } = await res.json();
        allTasks = data || [];
        renderTags();
        renderTasks();
    } else {
        handleLogout(); // Token might be expired
    }
}

// NEW: Render the list of unique tags in the sidebar
function renderTags() {
    const tagList = document.getElementById('tag-list');
    tagList.innerHTML = '';

    // Add an "All" filter option
    const allLi = document.createElement('li');
    allLi.textContent = 'All Tasks';
    allLi.className = currentTagFilter === null ? 'active' : '';
    allLi.addEventListener('click', () => {
        currentTagFilter = null;
        renderTags();
        renderTasks();
    });
    tagList.appendChild(allLi);

    // Get unique tags
    const tags = [...new Set(allTasks.flatMap(task => task.tags ? task.tags.split(',') : []))];
    
    tags.forEach(tag => {
        if (!tag) return;
        const li = document.createElement('li');
        li.textContent = `#${tag}`;
        li.className = currentTagFilter === tag ? 'active' : '';
        if (li.className !== 'active') {
            li.style.color = getTagColor(tag);
        }
        li.addEventListener('click', () => {
            currentTagFilter = tag;
            renderTags();
            renderTasks();
        });
        tagList.appendChild(li);
    });
}

// UPDATED: Now filters tasks, handles pagination for completed tasks
function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const completedList = document.getElementById('completed-list');
    const showMoreBtn = document.getElementById('show-more-btn');

    todoList.innerHTML = '';
    completedList.innerHTML = '';

    let filteredTasks = allTasks;

    // Apply search filter first
    if (currentSearchQuery) {
        const lowerCaseQuery = currentSearchQuery.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
            task.content.toLowerCase().includes(lowerCaseQuery)
        );
    }

    // Apply tag filter next
    if (currentTagFilter) {
        filteredTasks = filteredTasks.filter(task =>
            task.tags && task.tags.split(',').includes(currentTagFilter)
        );
    }

    const todoTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    // Render Todo tasks
    todoTasks.forEach(task => {
        const taskEl = createTaskElement(task);
        todoList.appendChild(taskEl);
    });

    // Render Completed tasks with pagination
    completedTasks.slice(0, completedTasksToShow).forEach(task => {
        const taskEl = createTaskElement(task);
        completedList.appendChild(taskEl);
    });

    // Show or hide the "Show More" button
    if (completedTasks.length > completedTasksToShow) {
        showMoreBtn.style.display = 'block';
    } else {
        showMoreBtn.style.display = 'none';
    }
}

// NEW: Helper function to create a task element to avoid repetition
function createTaskElement(task) {
    const taskEl = document.createElement('li');
    taskEl.dataset.id = task.ID;
    taskEl.className = task.completed ? 'completed' : '';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.ID, !task.completed));

    const taskDetails = document.createElement('div');
    taskDetails.className = 'task-details';

    const content = document.createElement('span');
    content.className = 'content';
    content.textContent = task.content;
    content.addEventListener('click', () => editTaskContent(content, task.ID));

    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    const date = new Date(task.completed ? task.UpdatedAt : task.CreatedAt);
    const label = task.completed ? 'Completed' : 'Created';
    timestamp.textContent = `${label} ${date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`;

    taskDetails.appendChild(content);
    taskDetails.appendChild(timestamp);

    const tags = document.createElement('span');
    tags.className = 'tags';
    if (task.tags) {
        task.tags.split(',').forEach(tag => {
            if (!tag) return;
            const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.textContent = `#${tag}`;
                tagEl.style.backgroundColor = getTagColor(tag);
                tags.appendChild(tagEl);
        });
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => deleteTask(task.ID));

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.appendChild(tags);
    actions.appendChild(deleteBtn);

    taskEl.appendChild(checkbox);
    taskEl.appendChild(taskDetails);
    taskEl.appendChild(actions);

    return taskEl;
}

async function handleCreateTask(e) {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const inputValue = input.value.trim();
    if (!inputValue) return;

    const tagMatches = [...inputValue.matchAll(/#([^\s#]+)/g)];
    const tags = tagMatches.map(match => match[1]);
    const content = inputValue.replace(/#([^\s#]+)/g, '').trim();

    const token = localStorage.getItem('token');
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, tags: tags.join(',') })
    });

    if (res.ok) {
        input.value = '';
        loadTasks();
    } else {
        alert('Failed to create task');
    }
}

async function toggleTaskCompletion(id, completed) {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
    });

    if (res.ok) {
        // Optimistic update for faster UI response
        const task = allTasks.find(t => t.ID === id);
        if (task) {
            task.completed = completed;
            task.UpdatedAt = new Date().toISOString(); // Update timestamp
        }
        renderTasks();
    } else {
        alert('Failed to update task');
        loadTasks(); // Re-fetch to correct state
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        allTasks = allTasks.filter(t => t.ID !== id);
        renderTags();
        renderTasks();
    } else {
        alert('Failed to delete task');
    }
}

function editTaskContent(span, id) {
    const currentContent = span.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentContent;
    input.className = 'content-edit'; // For styling if needed
    span.parentElement.replaceChild(input, span);
    input.focus();

    const saveChanges = async () => {
        const newContent = input.value.trim();
        if (newContent && newContent !== currentContent) {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newContent })
            });
            if (!res.ok) {
                alert('Failed to update task content');
            }
        }
        loadTasks(); // Always reload to ensure data consistency
    };

    input.addEventListener('blur', saveChanges);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            input.value = currentContent; // Revert changes
            input.blur();
        }
    });
}

// PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
            .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
}