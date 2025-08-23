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

    // Task form submission for both desktop and mobile
    document.getElementById('task-form').addEventListener('submit', handleCreateTask);
    document.getElementById('mobile-task-form').addEventListener('submit', handleCreateTask);

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
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    const mobileSidebarToggleBtn = document.getElementById('mobile-sidebar-toggle');
    const desktopSidebarToggleBtn = document.getElementById('desktop-sidebar-toggle');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    // Check for saved state or mobile view
    const mainContent = document.querySelector('.sidebar-adjusted');
    const isInitiallyCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    
    if (window.innerWidth < 1024) { // 移动端和平板
        sidebar.classList.add('collapsed');
        sidebar.style.transform = 'translateX(-100%)';
        sidebarOverlay.classList.add('hidden');
    } else if (isInitiallyCollapsed) { // 桌面端
        sidebar.classList.add('collapsed');
        if (window.innerWidth >= 1024) { // lg breakpoint
            mainContent.style.marginLeft = mainContent.dataset.collapsedMargin;
        }
    }

    // 桌面端折叠按钮事件
    sidebarCollapseBtn.addEventListener('click', () => {
        const mainContent = document.querySelector('.sidebar-adjusted');
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed);
        
        if (window.innerWidth >= 1024) { // lg breakpoint
            mainContent.style.marginLeft = isCollapsed ? mainContent.dataset.collapsedMargin : mainContent.dataset.expandedMargin;
        }
    });

    // 移动端菜单按钮事件
    mobileSidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        sidebar.style.transform = 'translateX(0)';
        sidebarOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    // 移动端关闭按钮事件
    desktopSidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        sidebar.style.transform = 'translateX(-100%)';
        sidebarOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    });

    // 遮罩层点击事件
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        sidebar.style.transform = 'translateX(-100%)';
        sidebarOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    });

    // --- Collapsible Task Sections Logic ---
    const todoSection = document.getElementById('todo-section');
    const completedSection = document.getElementById('completed-section');

    // Set initial states based on localStorage or defaults
    if (localStorage.getItem('todo-collapsed') === 'true') {
        todoSection.classList.add('collapsed');
        todoSection.querySelector('.task-section-header svg').style.transform = 'rotate(-90deg)';
    } else {
        todoSection.classList.remove('collapsed');
    }

    // 默认折叠已完成任务列表
    completedSection.classList.add('collapsed');
    completedSection.querySelector('.task-section-header svg').style.transform = 'rotate(-90deg)';
    localStorage.setItem('completed-collapsed', 'true');

    todoSection.querySelector('.task-section-header').addEventListener('click', () => {
        const isCollapsed = todoSection.classList.toggle('collapsed');
        localStorage.setItem('todo-collapsed', isCollapsed);
        todoSection.querySelector('.task-section-header svg').style.transform = isCollapsed ? 'rotate(-90deg)' : '';
    });

    completedSection.querySelector('.task-section-header').addEventListener('click', () => {
        const isCollapsed = completedSection.classList.toggle('collapsed');
        localStorage.setItem('completed-collapsed', isCollapsed);
        completedSection.querySelector('.task-section-header svg').style.transform = isCollapsed ? 'rotate(-90deg)' : '';
    });
    // --- End Collapsible Task Sections Logic ---

    // Handle window resize
    window.addEventListener('resize', () => {
        const mainContent = document.querySelector('.sidebar-adjusted');
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (window.innerWidth >= 1024) { // 桌面端
            // 重置移动端样式
            sidebar.style.transform = '';
            mainContent.style.marginLeft = isCollapsed ? mainContent.dataset.collapsedMargin : mainContent.dataset.expandedMargin;
            sidebarOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        } else { // 移动端
            mainContent.style.marginLeft = ''; // 重置默认CSS值
            if (isCollapsed) {
                sidebar.style.transform = 'translateX(-100%)';
                sidebarOverlay.classList.add('hidden');
                document.body.style.overflow = '';
            } else {
                sidebar.style.transform = 'translateX(0)';
                sidebarOverlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    // --- End Collapsible Task Sections Logic ---

    // --- Tag Autocomplete Logic ---
    const taskInput = document.getElementById('task-input');
    const mobileTaskInput = document.getElementById('mobile-task-input');
    const autocompleteContainer = document.getElementById('tag-autocomplete-container');
    const mobileAutocompleteContainer = document.getElementById('mobile-tag-autocomplete-container');

    // 自动调整输入框高度的函数
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto'; // 重置高度
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'; // 设置新高度，最大200px
    }

    // 为两个输入框添加自动调整高度的功能
    [taskInput, mobileTaskInput].forEach(textarea => {
        // 初始化高度
        autoResizeTextarea(textarea);
        
        // 监听输入事件
        textarea.addEventListener('input', () => {
            autoResizeTextarea(textarea);
        });
    });

    function handleTagAutocomplete(input, container) {
        const cursorPos = input.selectionStart;
        const textBeforeCursor = input.value.substring(0, cursorPos);
        const tagMatch = textBeforeCursor.match(/#([^\s#]*)$/);

        if (tagMatch) {
            const currentTagQuery = tagMatch[1];
            const allTags = [...new Set(allTasks.flatMap(task => task.tags ? task.tags.split(',') : []))].filter(Boolean);
            const matchingTags = allTags.filter(tag => tag.toLowerCase().startsWith(currentTagQuery.toLowerCase()));
            
            showAutocomplete(matchingTags, currentTagQuery, input, container);
        } else {
            hideAutocomplete(container);
        }
    }

    // 桌面端输入监听
    taskInput.addEventListener('input', () => {
        handleTagAutocomplete(taskInput, autocompleteContainer);
    });

    // 移动端输入监听
    mobileTaskInput.addEventListener('input', () => {
        handleTagAutocomplete(mobileTaskInput, mobileAutocompleteContainer);
    });

    function showAutocomplete(tags, query, input, container) {
        if (tags.length === 0) {
            hideAutocomplete(container);
            return;
        }
        container.innerHTML = '';
        tags.forEach(tag => {
            const div = document.createElement('div');
            div.className = 'p-2 hover:bg-gray-100 cursor-pointer';
            div.textContent = tag;
            div.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent input from losing focus
                const textBeforeCursor = input.value.substring(0, input.selectionStart);
                const textAfterCursor = input.value.substring(input.selectionStart);
                
                const newTextBefore = textBeforeCursor.replace(/#([^\s#]*)$/, `#${tag} `);
                
                input.value = newTextBefore + textAfterCursor;
                hideAutocomplete(container);
                input.focus();
            });
            container.appendChild(div);
        });
        container.style.display = 'block';
    }

    function hideAutocomplete(container) {
        container.style.display = 'none';
    }

    // 处理输入框失焦
    taskInput.addEventListener('blur', () => {
        setTimeout(() => hideAutocomplete(autocompleteContainer), 150);
    });

    mobileTaskInput.addEventListener('blur', () => {
        setTimeout(() => hideAutocomplete(mobileAutocompleteContainer), 150);
    });
    // --- End Tag Autocomplete Logic ---

    // 添加折叠任务列表相关的CSS
    const style = document.createElement('style');
    style.textContent = `
        .task-content {
            transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
            max-height: 2000px;
            opacity: 1;
            overflow: hidden;
        }
        .collapsed .task-content {
            max-height: 0;
            opacity: 0;
            padding: 0;
            margin: 0;
            border: none;
        }
    `;
    document.head.appendChild(style);
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
    const allContent = document.createElement('div');
    allContent.className = 'flex items-center space-x-2';
    
    // Add icon
    const allIcon = document.createElement('svg');
    allIcon.className = 'tag-icon w-4 h-4 text-secondary';
    allIcon.setAttribute('fill', 'none');
    allIcon.setAttribute('stroke', 'currentColor');
    allIcon.setAttribute('viewBox', '0 0 24 24');
    allIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />';
    
    // Add text
    const allText = document.createElement('span');
    allText.className = 'tag-text';
    allText.textContent = 'All Tasks';
    
    allContent.appendChild(allIcon);
    allContent.appendChild(allText);
    allLi.appendChild(allContent);
    
    allLi.className = `flex items-center px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer ${currentTagFilter === null ? 'bg-primary/10 text-primary' : ''}`;
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
        const content = document.createElement('div');
        content.className = 'flex items-center space-x-2';
        
        // Add tag icon
        const tagIcon = document.createElement('svg');
        tagIcon.className = 'tag-icon w-4 h-4';
        tagIcon.setAttribute('fill', 'none');
        tagIcon.setAttribute('stroke', 'currentColor');
        tagIcon.setAttribute('viewBox', '0 0 24 24');
        tagIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />';
        tagIcon.style.color = getTagColor(tag);
        
        // Add tag text
        const tagText = document.createElement('span');
        tagText.className = 'tag-text';
        tagText.textContent = tag;
        
        content.appendChild(tagIcon);
        content.appendChild(tagText);
        li.appendChild(content);
        
        li.className = `flex items-center px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer ${currentTagFilter === tag ? 'bg-primary/10 text-primary' : ''}`;
        
        if (currentTagFilter !== tag) {
            tagIcon.style.color = getTagColor(tag);
            tagText.style.color = getTagColor(tag);
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
// 标签操作相关变量
let currentTag = null;
const tagMenu = document.getElementById('tag-menu');
const editTagBtn = document.getElementById('edit-tag-btn');
const deleteTagBtn = document.getElementById('delete-tag-btn');
const editTagModal = document.getElementById('edit-tag-modal');
const editTagForm = document.getElementById('edit-tag-form');
const editTagInput = document.getElementById('edit-tag-input');

// 全局变量，用于存储当前操作的任务ID
let currentTaskId = null;

// 处理标签点击事件
function handleTagClick(event, tagText, taskId) {
    event.preventDefault();
    event.stopPropagation();
    
    // 存储当前操作的任务ID
    currentTaskId = taskId;
    
    // 确保 tagText 是干净的标签文本，不包含 # 号
    currentTag = tagText.startsWith('#') ? tagText.substring(1) : tagText;
    
    // 定位菜单，考虑滚动位置
    const rect = event.target.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    
    tagMenu.style.top = `${rect.bottom + scrollY + 5}px`;
    tagMenu.style.left = `${rect.left + scrollX}px`;
    tagMenu.classList.remove('hidden');
    
    // 添加点击其他地方关闭菜单的一次性事件监听
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!tagMenu.contains(e.target) && !e.target.closest('.task-tag')) {
                tagMenu.classList.add('hidden');
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 0);
}

// 关闭标签菜单
function closeTagMenu() {
    tagMenu.classList.add('hidden');
}

// 显示编辑标签模态框
function showEditTagModal() {
    editTagInput.value = currentTag.replace('#', '');
    editTagModal.classList.remove('hidden');
    editTagInput.focus();
}

// 关闭编辑标签模态框
function closeEditTagModal() {
    editTagModal.classList.add('hidden');
    currentTag = null;
}

// 初始化标签操作事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 点击其他地方关闭标签菜单
    document.addEventListener('click', (event) => {
        if (!tagMenu.contains(event.target) && !event.target.closest('.task-tag')) {
            closeTagMenu();
        }
    });

    // 编辑标签按钮点击事件
    editTagBtn.addEventListener('click', () => {
        closeTagMenu();
        showEditTagModal();
    });

    // 删除标签按钮点击事件
    deleteTagBtn.addEventListener('click', async () => {
        if (confirm('确定要删除这个标签吗？')) {
            try {
                if (!currentTaskId) {
                    throw new Error('无法找到对应的任务');
                }
                
                const task = allTasks.find(t => t.ID === currentTaskId);
                if (!task) {
                    throw new Error('无法找到对应的任务数据');
                }

                // 从当前任务中移除该标签
                const taskTags = task.tags
                    .split(',')
                    .map(t => t.trim())  // 清理空格
                    .filter(t => t !== '' && t !== currentTag); // 移除空标签和目标标签
                
                // 获取任务的当前状态
                const currentResponse = await fetch(`/api/tasks/${currentTaskId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!currentResponse.ok) {
                    throw new Error('获取任务数据失败');
                }

                const currentTaskRes = await currentResponse.json();
                // 兼容后端返回 { data: { ...task } } 或直接返回任务对象
                const currentTask = currentTaskRes.data ? currentTaskRes.data : currentTaskRes;
                // 更新标签，保持其他字段不变
                const payload = {
                    tags: taskTags.join(',') || ''  // 只更新标签字段
                };

                const response = await fetch(`/api/tasks/${currentTaskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '更新任务标签失败');
                }

                // 等待后端更新成功后，重新加载任务列表以确保数据同步
                await loadTasks();

                // 重新渲染UI
                renderTags();
                renderTasks();
            } catch (error) {
                console.error('删除标签错误:', error);
                alert(error.message);
            }
        }
        closeTagMenu();
    });

    // 编辑标签表单提交
    editTagForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newTagText = editTagInput.value.trim();
        
        if (newTagText && newTagText !== currentTag) {
            try {
                // 更新所有任务中的标签
                allTasks = allTasks.map(task => {
                    if (!task.tags) return task;
                    const taskTags = task.tags.split(',').map(tag => tag === currentTag ? newTagText : tag);
                    return {
                        ...task,
                        tags: taskTags.join(',')
                    };
                });

                // 更新后端数据
                await fetch('/api/tasks/update-tags', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ 
                        oldTag: currentTag,
                        newTag: newTagText,
                        action: 'update'
                    })
                });

                renderTags();
                renderTasks();
            } catch (error) {
                console.error('Error updating tag:', error);
            }
        }
        closeEditTagModal();
    });

    // 关闭模态框按钮
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeEditTagModal);
    });
});

function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const completedList = document.getElementById('completed-list');
    const showMoreBtn = document.getElementById('show-more-btn');
    const todoSection = document.getElementById('todo-section');
    const completedSection = document.getElementById('completed-section');

    // 确保即使没有任务时也保持最小高度
    todoSection.style.minHeight = '20rem';
    completedSection.style.minHeight = '20rem';

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

    // 如果没有任务，添加空状态提示
    if (todoTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'flex items-center justify-center h-[10rem] text-secondary';
        emptyState.innerHTML = '还没有任务';
        todoList.appendChild(emptyState);
    }

    if (completedTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'flex items-center justify-center h-[10rem] text-secondary';
        emptyState.innerHTML = '还没有完成的任务';
        completedList.appendChild(emptyState);
    }
}

// Helper function to create a task element
function createTaskElement(task) {
    const taskEl = document.createElement('li');
    taskEl.dataset.id = task.ID;
    taskEl.className = `group p-4 hover:bg-background/50 transition-colors ${task.completed ? 'completed' : ''} mb-2 mx-2 border border-border/50 rounded-lg`;

    // Checkbox container
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'flex items-start space-x-3';

    // 添加相对定位以支持删除按钮的绝对定位
    taskEl.style.position = 'relative';

    // Custom checkbox with improved click area
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'relative flex-shrink-0 mt-1 cursor-pointer';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'peer absolute inset-0 opacity-0 w-6 h-6 cursor-pointer z-10';
    
    // 扩展点击区域
    const hitArea = document.createElement('div');
    hitArea.className = 'absolute -inset-1 z-0';
    
    const checkboxCustom = document.createElement('div');
    checkboxCustom.className = `w-6 h-6 border-2 rounded-md border-border peer-checked:border-success peer-checked:bg-success
                               flex items-center justify-center transition-colors group-hover:border-success/50
                               relative`;
    
    const checkIcon = document.createElement('svg');
    checkIcon.className = 'w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity';
    checkIcon.setAttribute('fill', 'none');
    checkIcon.setAttribute('stroke', 'currentColor');
    checkIcon.setAttribute('viewBox', '0 0 24 24');
    checkIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />';
    
    // 添加统一的点击事件处理
    const handleClick = () => toggleTaskCompletion(task.ID, !task.completed);
    checkbox.addEventListener('change', handleClick);
    checkboxWrapper.addEventListener('click', (e) => {
        // 防止事件冒泡，避免触发其他点击事件
        e.stopPropagation();
        handleClick();
    });
    
    checkboxCustom.appendChild(checkIcon);
    checkboxWrapper.appendChild(hitArea);
    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(checkboxCustom);

    // Task content
    const taskContent = document.createElement('div');
    taskContent.className = 'flex-1 min-w-0';

    const content = document.createElement('div');
    content.className = 'break-all';
    const contentText = document.createElement('span');
    contentText.className = `text-base ${task.completed ? 'line-through text-secondary' : ''}`;
    contentText.textContent = task.content;
    contentText.addEventListener('click', () => editTaskContent(contentText, task.ID));
    content.appendChild(contentText);

    const metadata = document.createElement('div');
    metadata.className = 'flex items-center space-x-2 mt-2';

    const timestamp = document.createElement('span');
    timestamp.className = 'text-xs text-secondary';
    const date = new Date(task.completed ? task.UpdatedAt : task.CreatedAt);
    const label = task.completed ? 'Completed' : 'Created';
    timestamp.textContent = `${label} ${date.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai', 
        hour12: false, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    })}`;

    metadata.appendChild(timestamp);

    // Tags
    if (task.tags) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'flex flex-wrap gap-1 mt-2';
        
        task.tags.split(',').forEach(tag => {
            if (!tag) return;
            if (!tag.trim()) return; // 跳过空标签
            const tagEl = document.createElement('span');
            const tagColor = getTagColor(tag);
            tagEl.className = 'task-tag inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors';
            tagEl.style.backgroundColor = `${tagColor}20`;
            tagEl.style.color = tagColor;
            
            // 添加hover效果
            tagEl.addEventListener('mouseenter', () => {
                tagEl.style.backgroundColor = `${tagColor}30`;
            });
            tagEl.addEventListener('mouseleave', () => {
                tagEl.style.backgroundColor = `${tagColor}20`;
            });
            
            // 添加点击事件，注意这里不要加 # 前缀，但要传入任务ID
            tagEl.addEventListener('click', (e) => handleTagClick(e, tag.trim(), task.ID));
            tagEl.textContent = tag.trim();
            tagsContainer.appendChild(tagEl);
        });
        
        taskContent.appendChild(content);
        taskContent.appendChild(tagsContainer);
        taskContent.appendChild(metadata);
    } else {
        taskContent.appendChild(content);
        taskContent.appendChild(metadata);
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'absolute right-4 top-4 text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 focus:opacity-100 transition-opacity';
    deleteBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>`;
    deleteBtn.addEventListener('click', () => deleteTask(task.ID));

    checkboxContainer.appendChild(checkboxWrapper);
    checkboxContainer.appendChild(taskContent);
    taskEl.appendChild(checkboxContainer);
    taskEl.appendChild(deleteBtn);

    return taskEl;
}

async function handleCreateTask(e) {
    e.preventDefault();
    const isDesktop = e.target.id === 'task-form';
    const input = document.getElementById(isDesktop ? 'task-input' : 'mobile-task-input');
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
        body: JSON.stringify({
            completed: Boolean(completed)  // 确保是布尔值
        })
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
    
    // 创建textarea替代input
    const textarea = document.createElement('textarea');
    textarea.value = currentContent;
    textarea.className = 'w-full px-2 py-1 bg-background border border-border rounded resize-none overflow-hidden focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[24px]';
    textarea.style.height = 'auto'; // 重置高度
    
    // 替换原有元素
    span.parentElement.replaceChild(textarea, span);
    textarea.focus();

    // 自动调整高度
    function autoResize() {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    
    // 初始调整高度
    autoResize();
    
    // 监听输入事件调整高度
    textarea.addEventListener('input', autoResize);

    const saveChanges = async () => {
        const newContent = textarea.value.trim();
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

    textarea.addEventListener('blur', saveChanges);
    
    // 处理键盘事件
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter 保存更改
            textarea.blur();
        } else if (e.key === 'Escape') {
            textarea.value = currentContent; // 还原更改
            textarea.blur();
        }
    });
}

// PWA 导航和侧边栏管理
function setupMobileNavigation() {
    // 获取DOM元素
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const desktopSidebarToggle = document.getElementById('desktop-sidebar-toggle');
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileSearch = document.getElementById('mobile-search');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const desktopSearchInput = document.getElementById('search-input');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    const mainContent = document.querySelector('.sidebar-adjusted');
    
    let touchStartX = 0;
    let touchMoveX = 0;
    let sidebarWidth = 256; // 16rem = 256px

    // 移动端搜索栏切换
    if (mobileSearchToggle) {
        mobileSearchToggle.addEventListener('click', () => {
            mobileSearch.classList.toggle('active');
            if (mobileSearch.classList.contains('active')) {
                document.getElementById('mobile-search-input').focus();
            }
        });
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.removeProperty('overflow');
    }

    function openSidebar() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 移动端手势控制
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        sidebar.style.transition = 'none';
    }

    function handleTouchMove(e) {
        touchMoveX = e.touches[0].clientX;
        const deltaX = touchMoveX - touchStartX;
        
        if (!sidebar.classList.contains('active') && deltaX > 0) {
            // 从左向右滑动打开侧边栏
            const translateX = Math.min(deltaX - sidebarWidth, 0);
            sidebar.style.transform = `translateX(${translateX}px)`;
            const opacity = (deltaX / sidebarWidth) * 0.5;
            sidebarOverlay.style.display = 'block';
            sidebarOverlay.style.opacity = opacity;
        } else if (sidebar.classList.contains('active') && deltaX < 0) {
            // 从右向左滑动关闭侧边栏
            const translateX = Math.max(deltaX, -sidebarWidth);
            sidebar.style.transform = `translateX(${translateX}px)`;
            const opacity = 0.5 - (Math.abs(deltaX) / sidebarWidth) * 0.5;
            sidebarOverlay.style.opacity = opacity;
        }
    }

    function handleTouchEnd(e) {
        const deltaX = touchMoveX - touchStartX;
        sidebar.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        sidebarOverlay.style.transition = 'opacity 0.3s ease-in-out';

        if (!sidebar.classList.contains('active') && deltaX > sidebarWidth * 0.4) {
            openSidebar();
        } else if (sidebar.classList.contains('active') && deltaX < -sidebarWidth * 0.4) {
            closeSidebar();
        } else {
            sidebar.style.transform = sidebar.classList.contains('active') ? 
                'translateX(0)' : 'translateX(-100%)';
            sidebarOverlay.style.opacity = sidebar.classList.contains('active') ? '1' : '0';
            if (!sidebar.classList.contains('active')) {
                sidebarOverlay.style.display = 'none';
            }
        }
    }

    // 添加事件监听器
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', openSidebar);
    }

    if (desktopSidebarToggle) {
        desktopSidebarToggle.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // 移动端手势
    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            }
            if (mobileSearch.classList.contains('active')) {
                mobileSearch.classList.remove('active');
            }
        }
    });

    // 处理侧边栏折叠
    function toggleSidebarCollapse(isCollapsed) {
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.replace('lg:ml-[256px]', 'lg:ml-[60px]');
            localStorage.setItem('sidebarCollapsed', 'true');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.replace('lg:ml-[60px]', 'lg:ml-[256px]');
            localStorage.setItem('sidebarCollapsed', 'false');
        }
    }

    // 初始化侧边栏状态
    if (sidebarCollapseBtn) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        toggleSidebarCollapse(isCollapsed);

        // 添加点击事件
        sidebarCollapseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebarCollapse(!sidebar.classList.contains('collapsed'));
        });

        // 添加双击侧边栏切换功能
        sidebar.addEventListener('dblclick', (e) => {
            if (window.innerWidth >= 1024 && e.target.closest('#sidebar')) {
                toggleSidebarCollapse(!sidebar.classList.contains('collapsed'));
            }
        });
    }

    // 搜索功能同步
    function syncSearchInputs(sourceInput, targetInput) {
        targetInput.value = sourceInput.value;
        // 触发搜索事件（如果有的话）
        const event = new Event('input', { bubbles: true });
        targetInput.dispatchEvent(event);
    }

    if (mobileSearchInput && desktopSearchInput) {
        mobileSearchInput.addEventListener('input', () => syncSearchInputs(mobileSearchInput, desktopSearchInput));
        desktopSearchInput.addEventListener('input', () => syncSearchInputs(desktopSearchInput, mobileSearchInput));
    }

    // 移动端搜索栏切换
    if (mobileSearchToggle) {
        mobileSearchToggle.addEventListener('click', () => {
            mobileSearch.classList.toggle('active');
            if (mobileSearch.classList.contains('active')) {
                mobileSearchInput.focus();
            }
        });
    }

    // 监听窗口大小变化
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isDesktop = window.innerWidth >= 1024;
            
            if (isDesktop) {
                // 桌面模式
                sidebar.style.removeProperty('transform');
                sidebarOverlay.classList.remove('active');
                document.body.style.removeProperty('overflow');
                
                // 恢复折叠状态
                const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                if (isCollapsed) {
                    sidebar.classList.add('collapsed');
                    mainContent.classList.replace('lg:ml-[256px]', 'lg:ml-[60px]');
                }
            } else {
                // 移动模式
                if (!sidebar.classList.contains('active')) {
                    sidebar.style.transform = 'translateX(-100%)';
                }
                sidebar.classList.remove('collapsed');
                mainContent.classList.replace('lg:ml-[60px]', 'lg:ml-[256px]');
                
                // 同步搜索内容
                if (mobileSearchInput && desktopSearchInput) {
                    mobileSearchInput.value = desktopSearchInput.value;
                }
            }
        }, 100);
    });

    // 处理 PWA 显示模式
    window.addEventListener('load', () => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.body.classList.add('standalone');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    setupMobileNavigation(); // 设置移动端导航
    // ...existing code...
});

// PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
            .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
}