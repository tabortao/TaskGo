// TaskGo PWA Service Worker
// 版本控制和缓存名称
const CACHE_NAME = 'taskgo-cache-v2';
const RUNTIME_CACHE = 'taskgo-runtime-v2';
const API_CACHE = 'taskgo-api-v2';

// 需要预缓存的静态资源
const STATIC_CACHE_URLS = [
  '/',
  '/static/css/style.css',
  '/static/css/theme.css',
  '/static/js/script.js',
  '/static/js/tailwind_config.js',
  '/manifest.json',
  '/static/icons/icon-192x192.png',
  '/static/icons/icon-512x512.png',
  '/static/icons/android-chrome-192x192.png',
  '/static/icons/android-chrome-512x512.png',
  '/static/icons/apple-touch-icon.png',
  '/static/icons/favicon-32x32.png',
  '/static/icons/favicon-16x16.png',
  '/static/icons/logo.png',
  'https://cdn.tailwindcss.com'
];

// 离线回退页面内容
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskGo - 离线模式</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               margin: 0; padding: 20px; background: #f8fafc; color: #1e293b; }
        .container { max-width: 400px; margin: 50px auto; text-align: center; 
                    background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #2563eb; margin-bottom: 16px; }
        p { color: #64748b; line-height: 1.6; }
        .retry-btn { background: #2563eb; color: white; border: none; padding: 12px 24px; 
                    border-radius: 8px; cursor: pointer; margin-top: 20px; }
        .retry-btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📱</div>
        <h1>TaskGo 离线模式</h1>
        <p>您当前处于离线状态，无法访问最新数据。请检查网络连接后重试。</p>
        <button class="retry-btn" onclick="window.location.reload()">重新连接</button>
    </div>
</body>
</html>
`;

// Service Worker 安装事件
self.addEventListener('install', event => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 预缓存静态资源');
        return cache.addAll(STATIC_CACHE_URLS.filter(url => !url.startsWith('https://cdn')));
      })
      .then(() => {
        console.log('[SW] 安装完成');
        return self.skipWaiting(); // 立即激活新的 Service Worker
      })
      .catch(error => {
        console.error('[SW] 安装失败:', error);
      })
  );
});

// Service Worker 激活事件
self.addEventListener('activate', event => {
  console.log('[SW] 激活中...');
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] 激活完成');
        return self.clients.claim(); // 立即控制所有客户端
      })
  );
});

// 网络请求拦截和缓存策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API 请求缓存策略 (网络优先，缓存回退)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // 静态资源缓存策略 (缓存优先)
  if (isStaticResource(url)) {
    event.respondWith(handleStaticResource(request));
    return;
  }
  
  // HTML 页面缓存策略 (网络优先，离线回退)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }
  
  // 默认策略：网络优先
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// 处理 API 请求 - 网络优先策略
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // 只缓存成功的 GET 请求
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] API 请求失败，尝试从缓存获取:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线提示
    return new Response(
      JSON.stringify({ error: '网络连接失败，请检查网络后重试' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 处理静态资源 - 缓存优先策略
async function handleStaticResource(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] 静态资源加载失败:', request.url);
    throw error;
  }
}

// 处理 HTML 请求 - 网络优先，离线回退
async function handleHtmlRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] HTML 请求失败，返回缓存或离线页面');
    
    // 尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面
    return new Response(OFFLINE_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// 判断是否为静态资源
function isStaticResource(url) {
  return (
    url.pathname.startsWith('/static/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/manifest.json'
  );
}

// 监听消息事件，支持手动更新缓存
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCache());
  }
});

// 更新缓存函数
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_CACHE_URLS.filter(url => !url.startsWith('https://cdn')));
    console.log('[SW] 缓存更新完成');
  } catch (error) {
    console.error('[SW] 缓存更新失败:', error);
  }
}

// 定期清理过期缓存
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCache());
  }
});

// 清理过期缓存
async function cleanupCache() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames
    .filter(name => name.startsWith('taskgo-') && !name.includes('v2'))
    .map(name => caches.delete(name));
  
  await Promise.all(deletePromises);
  console.log('[SW] 过期缓存清理完成');
}
