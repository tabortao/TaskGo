// --- Tag Color Generation ---
const tagColorCache = {};
const colorPalette = [
    '#0f9b82', '#1ea55e', '#2980b9', '#8e44ad', '#2c3e50',
    '#d4ac0d', '#d35400', '#c0392b', '#596468', '#117a65',
    '#1e8449', '#1a5276', '#6c3483', '#922b21', '#145a32',
    '#186a3b', '#196f3d', '#1b4f72', '#21618c', '#2471a3',
    '#5b2c6f', '#4a235a', '#78281f', '#943126', '#b03a2e',
    '#ba4a00', '#ca6f1e', '#935116', '#7e5109', '#b7950b'
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

// --- 图片上传功能 ---
let selectedImages = []; // 存储选中的图片文件

// 初始化图片上传功能
function initImageUpload() {
    // 桌面端图片上传
    const imageUploadBtn = document.getElementById('image-upload-btn');
    const imageUploadInput = document.getElementById('image-upload-input');
    const clearImagesBtn = document.getElementById('clear-images-btn');

    // 移动端图片上传
    const mobileImageUploadBtn = document.getElementById('mobile-image-upload-btn');
    const mobileImageUploadInput = document.getElementById('mobile-image-upload-input');
    const mobileClearImagesBtn = document.getElementById('mobile-clear-images-btn');

    // 桌面端事件监听
    if (imageUploadBtn && imageUploadInput) {
        imageUploadBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });

        imageUploadInput.addEventListener('change', (e) => {
            handleImageSelection(e.target.files, false);
        });
    }

    if (clearImagesBtn) {
        clearImagesBtn.addEventListener('click', () => {
            clearSelectedImages(false);
        });
    }

    // 移动端事件监听
    if (mobileImageUploadBtn && mobileImageUploadInput) {
        mobileImageUploadBtn.addEventListener('click', () => {
            mobileImageUploadInput.click();
        });

        mobileImageUploadInput.addEventListener('change', (e) => {
            handleImageSelection(e.target.files, true);
        });
    }

    if (mobileClearImagesBtn) {
        mobileClearImagesBtn.addEventListener('click', () => {
            clearSelectedImages(true);
        });
    }
}

// 处理图片选择
function handleImageSelection(files, isMobile) {
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    for (let file of files) {
        // 检查文件大小
        if (file.size > maxFileSize) {
            showToast(`图片 ${file.name} 超过5MB限制`, 'error');
            continue;
        }

        // 检查文件类型
        if (!allowedTypes.includes(file.type)) {
            showToast(`图片 ${file.name} 格式不支持`, 'error');
            continue;
        }

        // 检查是否已选择
        const isDuplicate = selectedImages.some(img => 
            img.name === file.name && img.size === file.size
        );
        if (isDuplicate) {
            showToast(`图片 ${file.name} 已选择`, 'warning');
            continue;
        }

        selectedImages.push(file);
    }

    // 更新预览
    updateImagePreview(isMobile);
}

// 更新图片预览
function updateImagePreview(isMobile) {
    const previewContainer = isMobile ? 
        document.getElementById('mobile-image-preview-container') : 
        document.getElementById('image-preview-container');
    const previewList = isMobile ? 
        document.getElementById('mobile-image-preview-list') : 
        document.getElementById('image-preview-list');

    if (!previewContainer || !previewList) return;

    // 清空预览列表
    previewList.innerHTML = '';

    if (selectedImages.length === 0) {
        previewContainer.classList.add('hidden');
        return;
    }

    // 显示预览容器
    previewContainer.classList.remove('hidden');

    // 为每个图片创建预览元素
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'relative group';
            previewItem.innerHTML = `
                <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-border">
                    <img src="${e.target.result}" alt="${file.name}" class="w-full h-full object-cover">
                </div>
                <button type="button" 
                        class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        onclick="removeSelectedImage(${index}, ${isMobile})"
                        title="删除图片">
                    ×
                </button>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    ${file.name}
                </div>
            `;
            previewList.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

// 删除选中的图片
function removeSelectedImage(index, isMobile) {
    selectedImages.splice(index, 1);
    updateImagePreview(isMobile);
    
    // 清空文件输入框
    const input = isMobile ? 
        document.getElementById('mobile-image-upload-input') : 
        document.getElementById('image-upload-input');
    if (input) {
        input.value = '';
    }
}

// 清除所有选中的图片
function clearSelectedImages(isMobile) {
    selectedImages = [];
    updateImagePreview(isMobile);
    
    // 清空文件输入框
    const input = isMobile ? 
        document.getElementById('mobile-image-upload-input') : 
        document.getElementById('image-upload-input');
    if (input) {
        input.value = '';
    }
}

// 上传图片到服务器
async function uploadTaskImages(taskId) {
    if (selectedImages.length === 0) {
        return { success: true, images: [] };
    }

    const formData = new FormData();
    selectedImages.forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch(`/api/tasks/${taskId}/images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
            // 清除已上传的图片
            selectedImages = [];
            updateImagePreview(false); // 桌面端
            updateImagePreview(true);  // 移动端
            
            return { success: true, images: result.images || [] };
        } else {
            throw new Error(result.error || 'Image upload failed');
        }
    } catch (error) {
        console.error('Image upload error:', error);
        showToast(error.message || 'Image upload failed', 'error');
        return { success: false, images: [] };
    }
}

// 删除任务图片
async function deleteTaskImage(taskId, imagePath) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/images`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ image_path: imagePath })
        });

        const result = await response.json();
        
        if (response.ok) {
            showToast('Picture deleted successfully', 'success');
            // 重新加载任务列表以更新显示
            loadTasks();
            return true;
        } else {
            throw new Error(result.error || 'Picture deletion failed');
        }
    } catch (error) {
        console.error('Picture deletion error:', error);
        showToast(error.message || 'Picture deletion failed', 'error');
        return false;
    }
}

// 渲染任务图片
function renderTaskImages(images, taskId) {
    if (!images || images.trim() === '') {
        return '';
    }

    const imageList = images.split(',').filter(img => img.trim() !== '');
    if (imageList.length === 0) {
        return '';
    }

    return `
        <div class="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            ${imageList.map(imagePath => `
                <div class="relative group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-border">
                    <div class="aspect-square w-full flex items-center justify-center p-1">
                        <img src="${imagePath.trim()}" 
                             alt="Mission pictures" 
                             class="max-w-full max-h-full object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                             onclick="showImageModal('${imagePath.trim()}')"
                             loading="lazy"
                             style="width: auto; height: auto;">
                    </div>
                    <button type="button" 
                            class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-lg"
                            onclick="deleteTaskImage(${taskId}, '${imagePath.trim()}')"
                            title="删除图片">
                        ×
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// 显示图片模态框
function showImageModal(imagePath) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="relative w-full h-full flex items-center justify-center">
            <img src="${imagePath}" 
                 alt="Picture Preview" 
                 class="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl">
            <button type="button" 
                    class="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors flex items-center justify-center text-xl"
                    onclick="this.closest('.fixed').remove()"
                    title="Close">
                ×
            </button>
        </div>
    `;
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('.relative') === modal.querySelector('.relative')) {
            modal.remove();
        }
    });
    
    // ESC键关闭
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    document.body.appendChild(modal);
}
// --- End 图片上传功能 ---

// 移动端下拉刷新功能
function setupPullToRefresh() {
    const mainContent = document.querySelector('main');
    let touchStartY = 0;
    let touchEndY = 0;
    let isRefreshing = false;
    const minPullDistance = 100; // 最小下拉距离
    
    // 创建刷新指示器
    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'fixed top-0 left-0 right-0 flex items-center justify-center bg-primary text-white py-2 z-50 transform -translate-y-full transition-transform';
    refreshIndicator.innerHTML = 'Pull down to refresh...';
    document.body.appendChild(refreshIndicator);
    
    // 触摸开始事件
    mainContent.addEventListener('touchstart', (e) => {
        // 只有当滚动到顶部时才启用下拉刷新
        if (mainContent.scrollTop <= 0) {
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    // 触摸移动事件
    mainContent.addEventListener('touchmove', (e) => {
        if (touchStartY > 0 && !isRefreshing) {
            touchEndY = e.touches[0].clientY;
            const distance = touchEndY - touchStartY;
            
            // 只有下拉时才显示指示器
            if (distance > 0 && mainContent.scrollTop <= 0) {
                // 计算下拉距离的百分比，最大为100%
                const pullPercentage = Math.min(distance / minPullDistance, 1);
                const translateY = pullPercentage * 100 - 100; // -100% 到 0%
                
                refreshIndicator.style.transform = `translateY(${translateY}%)`;
                
                // 更新提示文本
                if (distance >= minPullDistance) {
                    refreshIndicator.innerHTML = 'Release to refresh';
                } else {
                    refreshIndicator.innerHTML = 'Pull down to refresh...';
                }
                
                // 防止页面滚动
                if (distance > 10) {
                    e.preventDefault();
                }
            }
        }
    }, { passive: false });
    
    // 触摸结束事件
    mainContent.addEventListener('touchend', () => {
        if (touchStartY > 0 && touchEndY > 0 && !isRefreshing) {
            const distance = touchEndY - touchStartY;
            
            // 如果下拉距离足够，则刷新页面
            if (distance >= minPullDistance) {
                isRefreshing = true;
                refreshIndicator.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Refreshing...';
                refreshIndicator.style.transform = 'translateY(0)';
                
                // 刷新数据
                setTimeout(() => {
                    loadTasks().then(() => {
                        // 重置状态
                        isRefreshing = false;
                        touchStartY = 0;
                        touchEndY = 0;
                        refreshIndicator.style.transform = 'translateY(-100%)';
                    });
                }, 1000);
            } else {
                // 如果下拉距离不够，恢复指示器位置
                refreshIndicator.style.transform = 'translateY(-100%)';
            }
        }
    }, { passive: true });
}

// Global state to hold all tasks and the current filter
let allTasks = [];
let currentTagFilter = null;
let currentSearchQuery = '';
let completedTasksToShow = 10;
let currentView = 'all'; // 'all' or 'favorites'
let tagAutocompleteVisible = false;
let currentAutocompleteInput = null;

// 主题模式设置
let currentTheme = localStorage.getItem('theme-mode') || 'system';

// 应用主题模式
function applyTheme(theme) {
    // 保存当前主题设置到本地存储
    localStorage.setItem('theme-mode', theme);
    currentTheme = theme;
    
    // 根据主题模式设置应用深色或浅色模式
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else if (theme === 'system') {
        // 根据系统偏好设置主题
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}

// 更新页眉/移动端切换按钮的图标与ARIA状态（中文注释）
function updateThemeToggleUI(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    const icon = document.getElementById('theme-toggle-icon');
    const mBtn = document.getElementById('mobile-theme-toggle-btn');
    const mIcon = document.getElementById('mobile-theme-icon');
    const setIcon = (el) => {
        if (!el) return;
        if (theme === 'dark') {
            el.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />';
        } else if (theme === 'light') {
            el.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />';
        } else {
            el.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m7-5a7 7 0 100 14 7 7 0 000-14z" />';
        }
    };
    setIcon(icon);
    setIcon(mIcon);
    if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
    if (mBtn) mBtn.setAttribute('aria-pressed', String(theme === 'dark'));
}

// 循环切换主题：light -> dark -> system
function cycleTheme() {
    const order = ['light', 'dark', 'system'];
    const idx = order.indexOf(currentTheme);
    const next = order[(idx + 1) % order.length];
    applyTheme(next);
    updateThemeToggleUI(next);
}

// 监听系统主题变化
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (currentTheme === 'system') {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 应用保存的主题设置
    applyTheme(currentTheme);
    updateThemeToggleUI(currentTheme);
    
    // 检查是否有保存的用户名
    const savedUsername = localStorage.getItem('saved_username');
    if (savedUsername) {
        document.getElementById('login-username').value = savedUsername;
        document.getElementById('remember-username').checked = true;
        
        // 只有在有保存的用户名时才检查是否有保存的密码
        const savedPassword = localStorage.getItem('saved_password');
        if (savedPassword) {
            document.getElementById('login-password').value = atob(savedPassword); // 解码密码
            document.getElementById('remember-password').checked = true;
        }
    }
    
    // 移动端下拉刷新功能
    if ('ontouchstart' in window) {
        setupPullToRefresh();
    }
    
    // 初始化图片上传功能
    initImageUpload();
    
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
        if (menu) {
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        } else {
            logEvent('error', { message: 'user menu not found', source: 'user-profile toggle' });
        }
    });

    // Settings Modal
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeBtn = settingsModal ? settingsModal.querySelector('.close-btn') : null;

    if (closeBtn && settingsModal) {
        closeBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            logEvent('nav', { to: 'main', via: 'close' });
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target == settingsModal) {
            settingsModal.style.display = 'none';
            logEvent('nav', { to: 'main', via: 'overlay' });
        }
    });

    document.getElementById('avatar-form').addEventListener('submit', handleAvatarUpload);
    document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
    
    // 主题模式切换事件监听
    document.querySelectorAll('input[name="theme-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                applyTheme(e.target.value);
                updateThemeToggleUI(e.target.value);
            }
        });
    });

    // 页眉与移动端暗亮切换按钮（中文注释）
    const headerToggle = document.getElementById('theme-toggle-btn');
    const mobileToggle = document.getElementById('mobile-theme-toggle-btn');
    if (headerToggle) {
        headerToggle.addEventListener('click', (e) => {
            e.preventDefault();
            cycleTheme();
        });
    }
    if (mobileToggle) {
        mobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            cycleTheme();
        });
    }

    // Tags 折叠/展开逻辑与日志记录
    const tagsContent = document.getElementById('tags-content');
    const toggleTagsBtn = document.getElementById('toggle-tags-btn');
    const defaultCollapsed = localStorage.getItem('tagsCollapsed') === 'true';
    if (tagsContent) {
        tagsContent.classList.add('collapsible');
        if (defaultCollapsed) {
            tagsContent.classList.add('collapsed');
            if (toggleTagsBtn) toggleTagsBtn.setAttribute('aria-expanded', 'false');
        }
    }
    if (toggleTagsBtn && tagsContent) {
        toggleTagsBtn.addEventListener('click', () => {
            const collapsed = tagsContent.classList.toggle('collapsed');
            toggleTagsBtn.setAttribute('aria-expanded', String(!collapsed));
            localStorage.setItem('tagsCollapsed', String(collapsed));
            logEvent('tags_toggle', { collapsed });
        });
    }

    // Task form submission for both desktop and mobile
    document.getElementById('task-form').addEventListener('submit', handleCreateTask);
    document.getElementById('mobile-task-form').addEventListener('submit', handleCreateTask);

    // Setup tag autocomplete for both desktop and mobile inputs
    setupTagAutocomplete('task-input', 'tag-autocomplete-container');
    setupTagAutocomplete('mobile-task-input', 'mobile-tag-autocomplete-container');
    
    // Setup auto-resize for textareas
    setupAutoResize('task-input');
    setupAutoResize('mobile-task-input');
    
    // Setup mobile input handling
    setupMobileInputHandling();

    // Add tag button and modal handling
    const addTagBtn = document.getElementById('add-tag-btn');
    const createTagModal = document.getElementById('create-tag-modal');
    const createTagForm = document.getElementById('create-tag-form');
    const newTagInput = document.getElementById('new-tag-input');
    const closeModalBtns = createTagModal.querySelectorAll('.close-modal-btn');

    addTagBtn.addEventListener('click', () => {
        createTagModal.classList.remove('hidden');
        newTagInput.focus();
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            createTagModal.classList.add('hidden');
            newTagInput.value = '';
        });
    });

    // Close modal when clicking outside
    createTagModal.addEventListener('click', (e) => {
        if (e.target === createTagModal) {
            createTagModal.classList.add('hidden');
            newTagInput.value = '';
        }
    });

    // Handle create tag form submission
    createTagForm.addEventListener('submit', handleCreateTag);

    // Main navigation items
    const allTasksNav = document.getElementById('all-tasks-nav');
    const favoritesNav = document.getElementById('favorites-nav');

    if (allTasksNav) {
        allTasksNav.addEventListener('click', () => {
            currentView = 'all';
            currentTagFilter = null; // Reset tag filter
            updateFavoritesNavState();
            renderTags();
            renderTasks();
        });
    }

    if (favoritesNav) {
        favoritesNav.addEventListener('click', () => {
            currentView = 'favorites';
            currentTagFilter = null; // Reset tag filter
            updateFavoritesNavState();
            renderTags();
            renderTasks();
        });
    }

    // Search input listener
    document.getElementById('search-input').addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        renderTasks();
    });

    // 滚动到底部自动加载更多任务
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) { // 距离底部100px时触发
            loadMoreCompletedTasks();
        }
    });
    
    // Logo 点击事件 - 返回顶部并聚焦到任务输入框
    const mobileLogo = document.getElementById('mobile-logo');
    const desktopLogo = document.getElementById('desktop-logo');
    
    if (mobileLogo) {
        mobileLogo.addEventListener('click', () => {
            // 平滑滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 滚动完成后聚焦到移动端输入框
            setTimeout(() => {
                const mobileInput = document.getElementById('mobile-task-input');
                if (mobileInput) {
                    mobileInput.focus();
                    // 确保输入框可见（如果被键盘遮挡）
                    mobileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500); // 给滚动一些时间完成
        });
    }
    
    if (desktopLogo) {
        desktopLogo.addEventListener('click', () => {
            // 平滑滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 滚动完成后聚焦到桌面端输入框
            setTimeout(() => {
                const desktopInput = document.getElementById('task-input');
                if (desktopInput) {
                    desktopInput.focus();
                }
            }, 500); // 给滚动一些时间完成
        });
    }

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
        mobileSidebarToggleBtn.setAttribute('aria-expanded', 'true');
    });

    // 移动端关闭按钮事件
    desktopSidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        sidebar.style.transform = 'translateX(-100%)';
        sidebarOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        mobileSidebarToggleBtn.setAttribute('aria-expanded', 'false');
    });

    // 遮罩层点击事件
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        sidebar.style.transform = 'translateX(-100%)';
        sidebarOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        mobileSidebarToggleBtn.setAttribute('aria-expanded', 'false');
    });

    // --- 任务列表逻辑 ---
    // 注意：任务列表已合并为一个section，不再需要折叠功能
    // 清除localStorage中的折叠状态，因为不再需要
    localStorage.removeItem('todo-collapsed');
    localStorage.removeItem('completed-collapsed');
    // --- End Task Sections Logic ---

    // Handle window resize
    window.addEventListener('resize', () => {
        const mainContent = document.querySelector('.sidebar-adjusted');
        const sidebar = document.getElementById('sidebar');
        
        if (!sidebar || !mainContent) return; // 确保元素存在
        
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

    // --- End Task Sections Logic ---

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

    // 为两个输入框添加自动调整高度的功能和键盘事件处理
    // 为桌面端输入框添加自动调整高度的功能和键盘事件处理
    taskInput.addEventListener('input', () => {
        autoResizeTextarea(taskInput);
    });
    taskInput.addEventListener('keydown', (e) => {
        // Shift+Enter插入换行
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const start = taskInput.selectionStart;
            const end = taskInput.selectionEnd;
            const value = taskInput.value;
            taskInput.value = value.substring(0, start) + '\n' + value.substring(end);
            taskInput.selectionStart = taskInput.selectionEnd = start + 1;
            autoResizeTextarea(taskInput);
        }
        // Enter键提交表单
        else if (e.key === 'Enter') {
            e.preventDefault();
            const form = taskInput.closest('form');
            form.dispatchEvent(new Event('submit'));
        }
    });

    // 为移动端输入框添加自动调整高度的功能和键盘事件处理
    mobileTaskInput.addEventListener('input', () => {
        autoResizeTextarea(mobileTaskInput);
    });
    mobileTaskInput.addEventListener('keydown', (e) => {
        // Enter键插入换行
        if (e.key === 'Enter') {
            e.preventDefault();
            const start = mobileTaskInput.selectionStart;
            const end = mobileTaskInput.selectionEnd;
            const value = mobileTaskInput.value;
            mobileTaskInput.value = value.substring(0, start) + '\n' + value.substring(end);
            mobileTaskInput.selectionStart = mobileTaskInput.selectionEnd = start + 1;
            autoResizeTextarea(mobileTaskInput);
        }
    });

    // 处理输入框失焦
    taskInput.addEventListener('blur', () => {
        setTimeout(() => hideTagAutocomplete(autocompleteContainer), 150);
    });

    mobileTaskInput.addEventListener('blur', () => {
        setTimeout(() => hideTagAutocomplete(mobileAutocompleteContainer), 150);
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

// 统一日志记录（保存到localStorage并输出控制台）
function logEvent(type, payload = {}) {
    try {
        const logs = JSON.parse(localStorage.getItem('taskgo_logs') || '[]');
        logs.push({ type, payload, ts: new Date().toISOString() });
        localStorage.setItem('taskgo_logs', JSON.stringify(logs));
        console.log('[TaskGoLog]', type, payload);
    } catch (e) {
        console.warn('logEvent failed:', e);
    }
}

// 全局错误捕获
window.addEventListener('error', (e) => {
    logEvent('error', { message: e.message, source: e.filename, line: e.lineno, col: e.colno });
});
window.addEventListener('unhandledrejection', (e) => {
    logEvent('error', { message: String(e.reason || 'unhandled rejection') });
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

// 记住用户名和密码的逻辑已移至主DOMContentLoaded事件监听器中

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const rememberUsername = document.getElementById('remember-username').checked;
    const rememberPassword = document.getElementById('remember-password').checked;

    // 保存用户名（如果选择了记住用户名）
    if (rememberUsername) {
        localStorage.setItem('saved_username', username);
    } else {
        localStorage.removeItem('saved_username');
    }
    
    // 只有在选择了记住密码时才保存密码
    // 注意：即使选择了记住密码，也必须选择记住用户名才能记住密码
    if (rememberPassword && rememberUsername) {
        localStorage.setItem('saved_password', btoa(password)); // 使用base64编码存储密码
    } else {
        localStorage.removeItem('saved_password');
    }

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
        console.log('API返回的任务数据:', data); // 调试输出
        allTasks = data || [];
        renderTags();
        renderTasks();
    } else {
        handleLogout(); // Token might be expired
    }
}

// Render the list of unique tags in the sidebar
// 渲染标签列表
function renderTags() {
    const tagList = document.getElementById('tag-list');
    tagList.innerHTML = '';

    // 获取所有任务中的唯一标签
    const tags = [...new Set(allTasks.flatMap(task => task.tags ? task.tags.split(',') : []))];
    
    tags.forEach(tag => {
        if (!tag) return;
        const li = document.createElement('li');
        const content = document.createElement('div');
        content.className = 'flex items-center space-x-2';
        
        // 添加标签图标
        const tagIcon = document.createElement('svg');
        tagIcon.className = 'tag-icon w-5 h-5'; // 修改为与All Tasks一致的大小
        tagIcon.setAttribute('fill', 'none');
        tagIcon.setAttribute('stroke', 'currentColor');
        tagIcon.setAttribute('viewBox', '0 0 24 24');
        tagIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />';
        tagIcon.style.color = getTagColor(tag);
        
        // 添加标签文本
        const tagText = document.createElement('span');
        tagText.className = 'tag-text text-sm font-medium'; // 添加与All Tasks一致的文字样式
        tagText.textContent = tag;
        
        content.appendChild(tagIcon);
        content.appendChild(tagText);
        li.appendChild(content);
        
        li.className = `flex items-center px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer ${currentTagFilter === tag ? 'bg-primary text-white' : ''}`;
        
        if (currentTagFilter !== tag) {
            const tagColor = getTagColor(tag);
            tagIcon.style.color = tagColor;
            tagText.style.color = tagColor;
            li.style.backgroundColor = `${tagColor}15`;
        }
        
        li.addEventListener('click', () => {
            // 检查是否点击了已选中的标签，如果是则取消筛选
            if (currentTagFilter === tag) {
                currentTagFilter = null; // 取消筛选
                // 移除所有标签的蓝色背景
                document.querySelectorAll('#tag-list li').forEach(tagElement => {
                    tagElement.classList.remove('bg-primary');
                    tagElement.classList.remove('text-white');
                });
            } else {
                currentTagFilter = tag; // 设置新的筛选标签
            }
            
            // 当点击标签时，将 currentView 设置为 'all'，确保只显示该标签下的所有任务
            currentView = 'all'; 
            updateFavoritesNavState(); // 更新导航状态以反映 currentView 的变化
            loadTasks(); // 使用loadTasks替代renderTags和renderTasks，确保数据刷新
        });
        
        // 添加右键菜单功能
        li.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            currentTag = tag;
            
            // 定位菜单
            const rect = e.target.getBoundingClientRect();
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            
            tagMenu.style.top = `${rect.bottom + scrollY + 5}px`;
            tagMenu.style.left = `${rect.left + scrollX}px`;
            tagMenu.classList.remove('hidden');
            
            // 添加点击其他地方关闭菜单的事件监听
            setTimeout(() => {
                const closeMenu = (event) => {
                    if (!tagMenu.contains(event.target)) {
                        tagMenu.classList.add('hidden');
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 0);
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
    
    // 点击标签时切换到该标签的任务列表
    const cleanTagText = tagText.startsWith('#') ? tagText.substring(1) : tagText;
    
    // 检查是否点击了已选中的标签，如果是则取消筛选
    if (currentTagFilter === cleanTagText) {
        currentTagFilter = null; // 取消筛选
        // 移除所有标签的蓝色背景
        document.querySelectorAll('#tag-list li').forEach(tagElement => {
            tagElement.classList.remove('bg-primary');
            tagElement.classList.remove('text-white');
        });
    } else {
        currentTagFilter = cleanTagText; // 设置新的筛选标签
    }
    
    currentView = 'all'; // 切换回全部任务视图
    
    // 更新导航状态
    updateFavoritesNavState();
    
    // 重新加载任务以刷新主内容区
    loadTasks();
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

function loadMoreCompletedTasks() {
    completedTasksToShow += 10;
    renderTasks();
}

function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const completedList = document.getElementById('completed-list');
    const showMoreBtn = document.getElementById('show-more-btn');
    
    if (!todoList || !completedList) return; // 确保元素存在
    
    todoList.innerHTML = '';
    completedList.innerHTML = '';

    let filteredTasks = allTasks;

    // Apply favorites filter first if in favorites view
    if (currentView === 'favorites') {
        filteredTasks = filteredTasks.filter(task => task.favorite);
    }

    // Apply search filter
    if (currentSearchQuery) {
        const lowerCaseQuery = currentSearchQuery.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
            task.content.toLowerCase().includes(lowerCaseQuery)
        );
    }

    // Apply tag filter
    if (currentTagFilter) {
        filteredTasks = filteredTasks.filter(task =>
            task.tags && task.tags.split(',').includes(currentTagFilter)
        );
    }

    const todoTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    // Sort todo tasks: pinned tasks first, then by creation time (newest first)
    todoTasks.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    });

    // Render Todo tasks
    todoTasks.forEach(task => {
        const taskEl = createTaskElement(task);
        todoList.appendChild(taskEl);
    });

    // Render Completed tasks with pagination (except in favorites view)
    if (currentView === 'favorites') {
        // 在Favorites页面显示所有已完成任务，不折叠
        completedTasks.forEach(task => {
            const taskEl = createTaskElement(task);
            completedList.appendChild(taskEl);
        });
        showMoreBtn.style.display = 'none';
    } else {
        // 在其他页面使用分页显示
        completedTasks.slice(0, completedTasksToShow).forEach(task => {
            const taskEl = createTaskElement(task);
            completedList.appendChild(taskEl);
        });
        
        // 不再显示"Show More"按钮
    showMoreBtn.style.display = 'none';
    }

    // 如果没有任务，添加空状态提示
    if (todoTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'flex items-center justify-center h-[10rem] text-secondary';
        if (currentView === 'favorites') {
            emptyState.innerHTML = 'Unfinished business that has not been bookmarked yet';
        } else {
            emptyState.innerHTML = 'There is no mission yet.';
        }
        todoList.appendChild(emptyState);
    }

    if (completedTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'flex items-center justify-center h-[10rem] text-secondary';
        if (currentView === 'favorites') {
            emptyState.innerHTML = 'No favorites have been completed yet';
        } else {
            emptyState.innerHTML = 'No completed tasks yet';
        }
        completedList.appendChild(emptyState);
    }
    updateFavoritesNavState(); // 更新导航状态
}

// 更新导航状态
function updateFavoritesNavState() {
    const allTasksNav = document.getElementById('all-tasks-nav');
    const favoritesNav = document.getElementById('favorites-nav');

    if (allTasksNav) {
        if (currentView === 'all') {
            allTasksNav.classList.add('bg-primary', 'text-white');
            allTasksNav.classList.remove('hover:bg-gray-100');
        } else {
            allTasksNav.classList.remove('bg-primary', 'text-white');
            allTasksNav.classList.add('hover:bg-gray-100');
        }
    }

    if (favoritesNav) {
        if (currentView === 'favorites') {
            favoritesNav.classList.add('bg-primary', 'text-white');
            favoritesNav.classList.remove('hover:bg-gray-100');
        } else {
            favoritesNav.classList.remove('bg-primary', 'text-white');
            favoritesNav.classList.add('hover:bg-gray-100');
        }
    }
}

// Helper function to create a task element
function createTaskElement(task) {
    const taskEl = document.createElement('li');
    taskEl.dataset.id = task.ID;
    let className = `group p-4 hover:bg-background/50 transition-colors ${task.completed ? 'completed' : ''} mb-2 mx-2 border border-border/50 rounded-lg`;
    if (task.pinned) {
        className += ' pinned';
    }
    taskEl.className = className;

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
    checkboxCustom.className = `w-6 h-6 border-2 rounded-md border-gray-400 peer-checked:border-success peer-checked:bg-success
                               flex items-center justify-center transition-colors group-hover:border-success/70
                               relative shadow-sm`;
    
    const checkIcon = document.createElement('svg');
    checkIcon.className = 'w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity';
    checkIcon.setAttribute('fill', 'none');
    checkIcon.setAttribute('stroke', 'currentColor');
    checkIcon.setAttribute('viewBox', '0 0 24 24');
    checkIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />';
    
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

    // 时间显示在左上角
    const timestamp = document.createElement('div');
    timestamp.className = 'text-xs text-secondary mb-2';
    const date = new Date(task.completed ? task.UpdatedAt : task.CreatedAt);
    const dateString = date.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai', 
        hour12: false, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    // Add "Pin·" prefix for pinned tasks
    timestamp.textContent = task.pinned ? `Pin·${dateString}` : dateString;

    // 任务内容另起一行
    const content = document.createElement('div');
    content.className = 'break-words whitespace-pre-wrap mb-2';
    const contentText = document.createElement('span');
    contentText.className = `text-base ${task.completed ? 'text-secondary' : ''}`;
    contentText.textContent = task.content;
    contentText.addEventListener('dblclick', () => editTaskContent(contentText, task.ID));
    content.appendChild(contentText);

    // 标签容器
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'flex flex-wrap gap-1';

    // 添加标签到标签容器
    if (task.tags) {
        task.tags.split(',').forEach(tag => {
            if (!tag) return;
            if (!tag.trim()) return; // 跳过空标签
            const tagEl = document.createElement('span');
            const tagColor = getTagColor(tag);
            tagEl.className = 'task-tag inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors';
            tagEl.style.backgroundColor = `${tagColor}30`;
            tagEl.style.color = tagColor;
            
            // 添加hover效果
            tagEl.addEventListener('mouseenter', () => {
                tagEl.style.backgroundColor = `${tagColor}40`;
            });
            tagEl.addEventListener('mouseleave', () => {
                tagEl.style.backgroundColor = `${tagColor}20`;
            });
            
            // 添加点击事件，注意这里不要加 # 前缀，但要传入任务ID
            tagEl.addEventListener('click', (e) => handleTagClick(e, tag.trim(), task.ID));
            tagEl.textContent = tag.trim();
            tagsContainer.appendChild(tagEl);
        });
    }

    taskContent.appendChild(timestamp);
    taskContent.appendChild(content);
    
    // 添加图片显示 - 放在标签上方
    if (task.images && task.images.trim() !== '') {
        const imagesHTML = renderTaskImages(task.images, task.ID);
        if (imagesHTML) {
            const imagesContainer = document.createElement('div');
            imagesContainer.innerHTML = imagesHTML;
            taskContent.appendChild(imagesContainer);
        }
    }
    
    taskContent.appendChild(tagsContainer);

    // 操作按钮容器 - 直接显示在右上角
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'absolute right-4 top-4 flex items-center space-x-2 opacity-100';

    // 收藏图标按钮
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `transition-colors focus:opacity-100 ${task.favorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-secondary hover:text-yellow-500'}`;
    favoriteBtn.innerHTML = task.favorite ? 
        `<svg class="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>` :
        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>`;
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskFavorite(task.ID, !task.favorite);
    });

    // 聊天图标按钮
    const commentBtn = document.createElement('button');
    commentBtn.className = 'text-secondary hover:text-primary focus:opacity-100 transition-colors relative';
    
    // Create comment icon with potential count badge
    let commentHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>`;
    
    // Add comment count badge if there are comments
    if (task.comment_count && task.comment_count > 0) {
        commentHTML += `<span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full min-w-2 h-2 flex items-center justify-center px-0.5 text-[8px] leading-none">${task.comment_count}</span>`;
    }
    
    commentBtn.innerHTML = commentHTML;
    commentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showCommentModal(task.ID);
    });

    // 三个竖向点的菜单按钮
    const menuBtn = document.createElement('button');
    menuBtn.className = 'text-secondary hover:text-primary focus:opacity-100 transition-colors';
    menuBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
    </svg>`;
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showTaskMenu(e, task.ID, task.pinned);
    });

    actionsContainer.appendChild(favoriteBtn);
    actionsContainer.appendChild(commentBtn);
    actionsContainer.appendChild(menuBtn);

    checkboxContainer.appendChild(checkboxWrapper);
    checkboxContainer.appendChild(taskContent);
    taskEl.appendChild(checkboxContainer);
    taskEl.appendChild(actionsContainer);

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
        const taskData = await res.json();
        console.log('创建任务返回的数据:', taskData); // 调试日志
        console.log('taskData.data:', taskData.data); // 调试data字段
        console.log('taskData.data.ID:', taskData.data ? taskData.data.ID : 'data字段不存在'); // 调试ID字段（大写）
        const taskId = taskData.data.ID; // 从data.ID获取（GORM使用大写ID）
        
        // 如果有选中的图片，上传图片
        if (selectedImages.length > 0) {
            console.log('Ready to upload images, taskId:', taskId); // 调试日志
            if (!taskId) {
                console.error('taskId is empty. Unable to upload image');
                showToast('Task created successfully, but image upload failed: Task ID retrieval failed', 'warning');
                return;
            }
            const uploadResult = await uploadTaskImages(taskId);
            if (!uploadResult.success) {
                showToast('Task created successfully, but image upload failed', 'warning');
            } else {
                showToast('Task and picture created successfully', 'success');
            }
        } else {
            showToast('Task created successfully', 'success');
        }
        
        input.value = '';
        // 重置输入框高度到默认值
        input.style.height = 'auto';
        input.style.height = '48px'; // 恢复到最小高度
        
        // 清除图片选择
        clearSelectedImages(false); // 桌面端
        clearSelectedImages(true);  // 移动端
        
        loadTasks();
    } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Task creation failed', 'error');
    }
}

async function handleCreateTag(e) {
    e.preventDefault();
    const tagName = document.getElementById('new-tag-input').value.trim();
    
    if (!tagName) {
        alert('Please enter a tag name');
        return;
    }

    // Check if tag already exists
    const existingTags = [...new Set(allTasks.flatMap(task => task.tags ? task.tags.split(',') : []))].filter(Boolean);
    if (existingTags.includes(tagName)) {
        alert('Tag already exists');
        return;
    }

    try {
        // Create a temporary task with the new tag to register it in the system
        const token = localStorage.getItem('token');
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                content: `Temporary task for tag: ${tagName}`, 
                tags: tagName 
            })
        });

        if (res.ok) {
            const response = await res.json();
            const taskId = response.data.ID;
            
            // Immediately delete the temporary task
            await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Close modal and refresh
            document.getElementById('create-tag-modal').classList.add('hidden');
            document.getElementById('new-tag-input').value = '';
            
            // Reload tasks to refresh the tag list
            await loadTasks();
            
            alert(`Tag "${tagName}" created successfully!`);
        } else {
            alert('Failed to create tag');
        }
    } catch (error) {
        console.error('Error creating tag:', error);
        alert('Failed to create tag');
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

async function toggleTaskFavorite(id, favorite) {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            favorite: Boolean(favorite)  // 确保是布尔值
        })
    });

    if (res.ok) {
        // Optimistic update for faster UI response
        const task = allTasks.find(t => t.ID === id);
        if (task) {
            task.favorite = favorite;
            task.UpdatedAt = new Date().toISOString(); // Update timestamp
        }
        renderTasks();
    } else {
        alert('Failed to update task favorite status');
        loadTasks(); // Re-fetch to correct state
    }
}

async function deleteTask(id) {
    if (!confirm('确定要删除这个任务吗？')) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const result = await res.json();
            allTasks = allTasks.filter(t => t.ID !== id);
            renderTags();
            renderTasks();
            showToast(result.message || '任务删除成功', 'success');
        } else {
            const error = await res.json();
            showToast(error.error || '删除任务失败', 'error');
        }
    } catch (error) {
        console.error('删除任务时发生错误:', error);
        showToast('删除任务时发生网络错误', 'error');
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

        // 添加单击侧边栏顶部切换功能
        const sidebarHeader = document.querySelector('#sidebar .p-4.border-b');
        if (sidebarHeader) {
            sidebarHeader.addEventListener('click', (e) => {
                // 确保点击的是侧边栏顶部区域，而不是用户菜单或关闭按钮
                if (window.innerWidth >= 1024 && !e.target.closest('#user-menu') && !e.target.closest('#desktop-sidebar-toggle')) {
                    toggleSidebarCollapse(!sidebar.classList.contains('collapsed'));
                }
            });
        }
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
// 任务菜单相关函数
function showTaskMenu(event, taskId, isPinned) {
    // 创建菜单元素
    const existingMenu = document.getElementById('task-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.id = 'task-menu';
    menu.className = 'fixed z-50 bg-surface rounded-lg shadow-lg border border-border w-48 py-1';
    
    const pinText = isPinned ? 'Unpin Task' : 'Pin Task';
    const pinIcon = isPinned ? 'M16 12V4a4 4 0 00-8 0v8' : 'M16 12V4a4 4 0 00-8 0v8L6 14v2h12v-2l-2-2z';
    
    menu.innerHTML = `
        <button id="copy-task-btn" class="w-full px-4 py-2 text-left text-sm hover:bg-background flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy Task</span>
        </button>
        <button id="edit-task-btn" class="w-full px-4 py-2 text-left text-sm hover:bg-background flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Task</span>
        </button>
        <button id="pin-task-btn" class="w-full px-4 py-2 text-left text-sm hover:bg-background flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${pinIcon}" />
            </svg>
            <span>${pinText}</span>
        </button>
        <button id="add-tag-btn" class="w-full px-4 py-2 text-left text-sm hover:bg-background flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Add Tag</span>
        </button>
        <button id="delete-task-btn" class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-background flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Task</span>
        </button>
    `;

    // 定位菜单
    const rect = event.target.getBoundingClientRect();
    menu.style.left = `${rect.left - 150}px`;
    menu.style.top = `${rect.bottom + 5}px`;

    document.body.appendChild(menu);

    // 添加事件监听器
    document.getElementById('copy-task-btn').addEventListener('click', () => {
        copyTaskToClipboard(taskId);
        menu.remove();
    });

    document.getElementById('edit-task-btn').addEventListener('click', () => {
        editTaskFromMenu(taskId);
        menu.remove();
    });

    document.getElementById('pin-task-btn').addEventListener('click', () => {
        pinTask(taskId, !isPinned);
        menu.remove();
    });

    document.getElementById('add-tag-btn').addEventListener('click', () => {
        console.log('Add Tag button clicked for task:', taskId);
        const tagName = prompt('请输入标签名称:');
        console.log('Tag name entered:', tagName);
        if (tagName && tagName.trim()) {
            console.log('Calling addTagToTask with:', taskId, tagName.trim());
            addTagToTask(taskId, tagName.trim());
        }
        menu.remove();
    });

    document.getElementById('delete-task-btn').addEventListener('click', () => {
        deleteTask(taskId);
        menu.remove();
    });

    // 点击外部关闭菜单
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

// Copy task to clipboard
function copyTaskToClipboard(taskId) {
    const task = allTasks.find(t => t.ID === taskId);
    if (!task) return;
    
    // Only copy task content, no tags
    const taskText = task.content;
    
    // Copy to clipboard
    navigator.clipboard.writeText(taskText).then(() => {
        // Show success message
        showToast('Task copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy task:', err);
        showToast('Failed to copy task', 'error');
    });
}

// Edit task from menu
function editTaskFromMenu(taskId) {
    const task = allTasks.find(t => t.ID === taskId);
    if (!task) return;
    
    // Find the task element and trigger edit mode
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    if (taskElement) {
        const contentSpan = taskElement.querySelector('.break-words span');
        if (contentSpan) {
            editTaskContent(contentSpan, taskId);
        }
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    
    // 根据类型设置不同的样式
    let bgColor, borderColor, textColor, icon;
    switch(type) {
        case 'error':
            bgColor = 'bg-red-50 dark:bg-red-900/20';
            borderColor = 'border-red-200 dark:border-red-800';
            textColor = 'text-red-800 dark:text-red-200';
            icon = '❌';
            break;
        case 'warning':
            bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
            borderColor = 'border-yellow-200 dark:border-yellow-800';
            textColor = 'text-yellow-800 dark:text-yellow-200';
            icon = '⚠️';
            break;
        case 'success':
        default:
            bgColor = 'bg-green-50 dark:bg-green-900/20';
            borderColor = 'border-green-200 dark:border-green-800';
            textColor = 'text-green-800 dark:text-green-200';
            icon = '✅';
            break;
    }
    
    toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-2 ${bgColor} ${borderColor} ${textColor} 
                      transform transition-all duration-300 ease-in-out animate-pulse max-w-sm`;
    
    // 创建内容容器
    const content = document.createElement('div');
    content.className = 'flex items-center space-x-3';
    
    // 添加图标
    const iconSpan = document.createElement('span');
    iconSpan.className = 'text-xl flex-shrink-0';
    iconSpan.textContent = icon;
    
    // 添加消息文本
    const messageSpan = document.createElement('span');
    messageSpan.className = 'font-medium text-sm leading-relaxed';
    messageSpan.textContent = message;
    
    content.appendChild(iconSpan);
    content.appendChild(messageSpan);
    toast.appendChild(content);
    
    document.body.appendChild(toast);
    
    // 添加进入动画
    setTimeout(() => {
        toast.style.transform = 'translateX(0) scale(1)';
        toast.style.opacity = '1';
    }, 10);
    
    // 3秒后开始退出动画
    setTimeout(() => {
        toast.style.transform = 'translateX(100%) scale(0.8)';
        toast.style.opacity = '0';
        // 动画完成后移除元素
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// 评论模态框相关函数
function showCommentModal(taskId) {
    // 创建模态框
    const existingModal = document.getElementById('comment-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'comment-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50';
    
    modal.innerHTML = `
        <div class="bg-surface rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-border">
                <h2 class="text-xl font-medium">Task Comments</h2>
                <button id="close-comment-modal" class="text-secondary hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
                <div id="comments-list" class="space-y-3 mb-4">
                    <!-- Comments will be loaded here -->
                </div>
            </div>
            <div class="p-4 border-t border-border">
                <form id="comment-form" class="flex space-x-2">
                    <input type="text" id="comment-input" placeholder="Add a comment..." 
                           class="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-primary">
                    <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        Send
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 加载评论
    loadComments(taskId);

    // 添加事件监听器
    document.getElementById('close-comment-modal').addEventListener('click', () => {
        modal.remove();
        // 关闭窗口后刷新任务页面
        loadTasks();
    });

    document.getElementById('comment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('comment-input');
        if (input.value.trim()) {
            addComment(taskId, input.value.trim());
            input.value = '';
        }
    });

    // 点击外部关闭模态框
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            // 关闭窗口后刷新任务页面
            loadTasks();
        }
    });
}

// 置顶任务函数
async function pinTask(taskId, pinned) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ pinned })
        });

        if (response.ok) {
            loadTasks(); // 重新加载任务列表
        } else {
            console.error('Failed to pin/unpin task');
        }
    } catch (error) {
        console.error('Error pinning task:', error);
    }
}

// 加载评论函数
async function loadComments(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/comments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const comments = result.data || [];
            renderComments(comments);
        } else {
            console.error('Failed to load comments');
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// 渲染评论函数
function renderComments(comments) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';

    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="text-secondary text-center">No comments yet</p>';
        return;
    }

    comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = 'bg-background p-3 rounded-lg';
        
        const date = new Date(comment.CreatedAt);
        const username = comment.User?.username || '';
        commentEl.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                ${username ? `<span class="font-medium text-sm">${username}</span>` : '<span class="font-medium text-sm text-secondary">Anonymous</span>'}
                <span class="text-xs text-secondary">${date.toLocaleString('zh-CN', {
                    timeZone: 'Asia/Shanghai',
                    hour12: false,
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</span>
            </div>
            <p class="text-sm">${comment.content}</p>
        `;
        
        commentsList.appendChild(commentEl);
    });
}

// 添加评论函数
async function addComment(taskId, content) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            loadComments(taskId); // 重新加载评论
        } else {
            console.error('Failed to add comment');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

// 向任务添加标签的函数
async function addTagToTask(taskId, tagName) {
    try {
        console.log('addTagToTask called with taskId:', taskId, 'tagName:', tagName);
        
        // 找到对应的任务
        const task = allTasks.find(t => t.ID === taskId);
        console.log('Found task:', task);
        if (!task) {
            console.error('Task not found with ID:', taskId);
            return;
        }

        // 获取现有标签
        const existingTags = task.tags ? task.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        console.log('Existing tags:', existingTags);
        
        // 检查标签是否已存在
        if (existingTags.includes(tagName)) {
            console.log('Tag already exists:', tagName);
            showToast('该标签已存在', 'error');
            return;
        }

        // 添加新标签
        const newTags = [...existingTags, tagName].join(',');
        console.log('New tags string:', newTags);

        // 更新任务
        const requestBody = {
            content: task.content,
            tags: newTags,
            completed: task.completed,
            favorite: task.favorite
        };
        console.log('Request body:', requestBody);
        
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        if (response.ok) {
            console.log('Tag added successfully, reloading tasks');
            showToast('标签添加成功', 'success');
            // 重新加载任务列表
            loadTasks();
        } else {
            const errorText = await response.text();
            console.error('Failed to add tag to task. Status:', response.status, 'Error:', errorText);
            showToast('添加标签失败', 'error');
        }
    } catch (error) {
        console.error('Error adding tag to task:', error);
        showToast('添加标签时发生错误', 'error');
    }
}

// Auto-resize textarea functionality
function setupAutoResize(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('input', () => {
        autoResizeTextarea(input);
    });
    
    // Initial resize
    autoResizeTextarea(input);
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200);
    textarea.style.height = newHeight + 'px';
}

// Mobile input handling for better UX
function setupMobileInputHandling() {
    const mobileInput = document.getElementById('mobile-task-input');
    if (!mobileInput) return;
    
    let isComposing = false;
    
    // Handle composition events (for IME input)
    mobileInput.addEventListener('compositionstart', () => {
        isComposing = true;
    });
    
    mobileInput.addEventListener('compositionend', () => {
        isComposing = false;
    });
    
    // Handle keydown events
    mobileInput.addEventListener('keydown', (e) => {
        // If user is composing (using IME), don't interfere
        if (isComposing) return;
        
        // Handle Enter key
        if (e.key === 'Enter') {
            // 在移动端，Enter键默认行为是换行，而不是提交
            // 阻止默认的提交行为，允许换行
            // 如果需要提交，用户应点击发送按钮
            return; // 允许默认的换行行为
        }
    });
    
    // Add visual indicator for Shift+Enter
    // const helpText = document.createElement('div');
    // helpText.className = 'text-xs text-secondary mt-1 px-1';
    // helpText.textContent = 'Press Enter to send, Shift+Enter for new line';
    
    const mobileForm = document.getElementById('mobile-task-form');
    const formContainer = mobileForm.querySelector('.relative');
    // formContainer.appendChild(helpText);
}

// Tag autocomplete functionality
function setupTagAutocomplete(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    
    if (!input || !container) return;
    
    // 监听输入事件
    input.addEventListener('input', (e) => {
        handleTagAutocomplete(e, container);
    });
    
    // 监听键盘事件
    input.addEventListener('keydown', (e) => {
        // 如果是#键，立即显示所有标签
        if (e.key === '#') {
            // 延迟执行，确保#字符已经输入到文本框中
            setTimeout(() => {
                handleTagAutocomplete({target: input}, container);
            }, 10);
        }
        // 处理导航键
        else if (tagAutocompleteVisible && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab')) {
            handleAutocompleteNavigation(e, container);
        }
    });
    
    // 点击外部区域关闭自动完成
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !container.contains(e.target)) {
            hideTagAutocomplete(container);
        }
    });
}

function handleTagAutocomplete(event, container) {
    const input = event.target;
    const value = input.value;
    const cursorPos = input.selectionStart;
    
    // Find if cursor is after a # character
    const textBeforeCursor = value.substring(0, cursorPos);
    const hashMatch = textBeforeCursor.match(/#([^\s#]*)$/);
    
    if (hashMatch) {
        const searchTerm = hashMatch[1].toLowerCase();
        const availableTags = getAvailableTags();
        
        // 如果是刚输入#，显示所有标签
        if (searchTerm === '') {
            showTagAutocomplete(container, availableTags, input, hashMatch.index + 1);
            return;
        }
        
        // 否则进行模糊搜索匹配
        const filteredTags = availableTags.filter(tag => {
            // 将标签转为小写进行比较
            const lowerTag = tag.toLowerCase();
            // 检查标签是否包含搜索词
            return lowerTag.includes(searchTerm);
        });
        
        if (filteredTags.length > 0) {
            showTagAutocomplete(container, filteredTags, input, hashMatch.index + 1);
        } else {
            hideTagAutocomplete(container);
        }
    } else {
        hideTagAutocomplete(container);
    }
}

function getAvailableTags() {
    const tags = new Set();
    allTasks.forEach(task => {
        if (task.tags) {
            task.tags.split(',').forEach(tag => {
                const trimmedTag = tag.trim();
                if (trimmedTag) {
                    tags.add(trimmedTag);
                }
            });
        }
    });
    return Array.from(tags).sort();
}

function showTagAutocomplete(container, tags, input, hashPosition) {
    container.innerHTML = '';
    container.classList.remove('hidden');
    tagAutocompleteVisible = true;
    currentAutocompleteInput = input;
    
    const tagsWrapper = document.createElement('div');
    tagsWrapper.className = 'tag-autocomplete-wrapper';
    
    const title = document.createElement('div');
    title.className = 'tag-autocomplete-title';
    // title.textContent = '选择标签:';
    tagsWrapper.appendChild(title);
    
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tag-autocomplete-items';
    
    // 如果没有标签，显示提示信息
    if (tags.length === 0) {
        const noTagsMsg = document.createElement('div');
        noTagsMsg.className = 'text-sm text-secondary';
        noTagsMsg.textContent = '没有匹配的标签';
        tagsContainer.appendChild(noTagsMsg);
    } else {
        // 添加所有标签
        tags.forEach((tag, index) => {
            const tagEl = document.createElement('button');
            tagEl.type = 'button';
            tagEl.className = 'tag-autocomplete-item';
            tagEl.style.backgroundColor = `${getTagColor(tag)}20`;
            tagEl.style.color = getTagColor(tag);
            tagEl.textContent = tag;
            tagEl.dataset.index = index;
            
            tagEl.addEventListener('click', () => {
                selectTag(tag, input, hashPosition);
            });
            
            tagsContainer.appendChild(tagEl);
        });
    }
    
    tagsWrapper.appendChild(tagsContainer);
    container.appendChild(tagsWrapper);
    
    // 聚焦第一个项目
    const firstItem = container.querySelector('.tag-autocomplete-item');
    if (firstItem) {
        firstItem.classList.add('active');
    }
}

function hideTagAutocomplete(container) {
    container.classList.add('hidden');
    tagAutocompleteVisible = false;
    currentAutocompleteInput = null;
}

function handleAutocompleteNavigation(event, container) {
    event.preventDefault();
    
    const items = container.querySelectorAll('.tag-autocomplete-item');
    const currentIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    
    if (event.key === 'ArrowDown') {
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        updateAutocompleteSelection(items, nextIndex);
    } else if (event.key === 'ArrowUp') {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        updateAutocompleteSelection(items, prevIndex);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
        if (currentIndex >= 0 && items[currentIndex]) {
            items[currentIndex].click();
        }
    }
}

function updateAutocompleteSelection(items, newIndex) {
    items.forEach((item, index) => {
        if (index === newIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function selectTag(tag, input, hashPosition) {
    const value = input.value;
    const cursorPos = input.selectionStart;
    
    // Find the # position and replace the partial tag
    const textBeforeCursor = value.substring(0, cursorPos);
    const hashMatch = textBeforeCursor.match(/#([^\s#]*)$/);
    
    if (hashMatch) {
        const beforeHash = value.substring(0, hashMatch.index);
        const afterCursor = value.substring(cursorPos);
        const newValue = beforeHash + '#' + tag + ' ' + afterCursor;
        
        input.value = newValue;
        const newCursorPos = hashMatch.index + tag.length + 2; // +2 for # and space
        input.setSelectionRange(newCursorPos, newCursorPos);
        
        // Auto-resize textarea
        if (typeof autoResizeTextarea === 'function') {
            autoResizeTextarea(input);
        }
    }
    
    // Hide autocomplete
    const container = input.id === 'task-input' ? 
        document.getElementById('tag-autocomplete-container') : 
        document.getElementById('mobile-tag-autocomplete-container');
    hideTagAutocomplete(container);
    
    input.focus();
}

// PWA Service Worker 注册和管理
if ('serviceWorker' in navigator) {
    let deferredPrompt;
    let swRegistration = null;

    // 监听 beforeinstallprompt 事件
    window.addEventListener('beforeinstallprompt', (e) => {
        // 阻止默认的安装提示
        e.preventDefault();
        deferredPrompt = e;
        
        // 显示自定义安装按钮
        showInstallPrompt();
    });

    // 监听应用安装事件
    window.addEventListener('appinstalled', () => {
        console.log('PWA 已安装');
        hideInstallPrompt();
        showToast('应用已成功安装到设备！', 'success');
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                swRegistration = registration;
                
                // 检查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdatePrompt();
                        }
                    });
                });
            })
            .catch(err => console.log('ServiceWorker registration failed: ', err));

        // 监听来自 service worker 的消息
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SKIP_WAITING') {
                window.location.reload();
            }
        });
    });

    // 显示安装提示
    function showInstallPrompt() {
        const installPrompt = document.createElement('div');
        installPrompt.id = 'pwa-install-prompt';
        installPrompt.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between';
        installPrompt.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <span>将 TaskGo 安装到您的设备</span>
            </div>
            <div class="flex space-x-2">
                <button id="install-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100">安装</button>
                <button id="dismiss-install" class="text-white hover:text-gray-200">×</button>
            </div>
        `;
        
        document.body.appendChild(installPrompt);
        
        // 安装按钮事件
        document.getElementById('install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('用户接受了安装提示');
                } else {
                    console.log('用户拒绝了安装提示');
                }
                deferredPrompt = null;
                hideInstallPrompt();
            }
        });
        
        // 关闭按钮事件
        document.getElementById('dismiss-install').addEventListener('click', () => {
            hideInstallPrompt();
        });
    }

    // 隐藏安装提示
    function hideInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.remove();
        }
    }

    // 显示更新提示
    function showUpdatePrompt() {
        const updatePrompt = document.createElement('div');
        updatePrompt.id = 'pwa-update-prompt';
        updatePrompt.className = 'fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between';
        updatePrompt.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>新版本可用，点击更新</span>
            </div>
            <div class="flex space-x-2">
                <button id="update-btn" class="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100">更新</button>
                <button id="dismiss-update" class="text-white hover:text-gray-200">×</button>
            </div>
        `;
        
        document.body.appendChild(updatePrompt);
        
        // 更新按钮事件
        document.getElementById('update-btn').addEventListener('click', () => {
            if (swRegistration && swRegistration.waiting) {
                swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            hideUpdatePrompt();
        });
        
        // 关闭按钮事件
        document.getElementById('dismiss-update').addEventListener('click', () => {
            hideUpdatePrompt();
        });
    }

    // 隐藏更新提示
    function hideUpdatePrompt() {
        const prompt = document.getElementById('pwa-update-prompt');
        if (prompt) {
            prompt.remove();
        }
    }
}
    // 设置页面返回与保存
    const settingsBackBtn = document.getElementById('settings-back-btn');
    const settingsSaveBtn = document.getElementById('settings-save-btn');
    if (settingsBackBtn) {
        settingsBackBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            logEvent('nav', { to: 'main', via: 'back' });
        });
    }
    if (settingsSaveBtn) {
        settingsSaveBtn.addEventListener('click', () => {
            const selectedTheme = document.querySelector('input[name="theme-mode"]:checked');
            if (selectedTheme) {
                applyTheme(selectedTheme.value);
            }
            showToast('Settings saved', 'success');
            logEvent('settings_save', { theme: selectedTheme ? selectedTheme.value : null });
        });
    }