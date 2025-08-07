const CACHE_NAME = 'jump-rope-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/students-list.html',
  '/student-photo-import.html',
  '/student-zone.html',
  '/rope-classroom.html',
  '/rainbow-certificate-detail.html',
  '/holyjumpvibe.html',
  '/sync-test.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

// 安裝Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('快取檔案中...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker 安裝完成');
        return self.skipWaiting();
      })
  );
});

// 啟動Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 啟動中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊的快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 啟動完成');
      return self.clients.claim();
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  // 跳過非GET請求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳過非HTTP/HTTPS請求
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果快取中有回應，返回快取的回應
        if (response) {
          console.log('從快取返回:', event.request.url);
          return response;
        }

        // 如果快取中沒有，嘗試從網路獲取
        return fetch(event.request)
          .then(response => {
            // 檢查回應是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 複製回應到快取
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // 只快取HTML、CSS、JS和圖片檔案
                const url = new URL(event.request.url);
                const isLocalFile = url.origin === location.origin;
                const isStaticFile = /\.(html|css|js|png|jpg|jpeg|gif|svg|ico)$/i.test(url.pathname);
                
                if (isLocalFile || isStaticFile) {
                  console.log('快取新檔案:', event.request.url);
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(error => {
            console.log('網路請求失敗:', event.request.url, error);
            
            // 如果是HTML頁面請求失敗，返回首頁
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            return new Response('離線模式 - 無法連接到伺服器', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 處理背景同步
self.addEventListener('sync', event => {
  console.log('背景同步:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 這裡可以添加背景同步邏輯
      console.log('執行背景同步...')
    );
  }
});

// 處理推播通知
self.addEventListener('push', event => {
  console.log('收到推播通知');
  
  const options = {
    body: event.data ? event.data.text() : '跳繩平台有新訊息',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iMTkiIGZpbGw9IiMyNTYzZWIiLz4KPHBhdGggZD0iTTQ4IDI0QzM5LjE2IDI0IDMyIDMxLjE2IDMyIDQwYzAgNS41NyAyLjgzIDEwLjUxIDcuMTIgMTIuMTlMNDggNjlsOC44OC0yNS4xOEM0Ny4xNyA0Mi41MSA1MCAzNy41NyA1MCA0MGMwLTguODQtNy4xNi0xNi0xNi0xNnoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzI1NjNlYiIvPgo8cGF0aCBkPSJNMTYgNkMxMi42OSA2IDEwIDguNjkgMTAgMTJjMCAyLjA5IDEuMDYgMy45NCAyLjY3IDUuMDdMMTYgMjZsMy4zMy04LjkzQzIwLjk0IDE1Ljk0IDIyIDE0LjA5IDIyIDEyYzAtMy4zMS0yLjY5LTYtNi02eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看詳情',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIgZmlsbD0iIzI1NjNlYiIvPgo8cGF0aCBkPSJNMTIgNmMtMy4zMSAwLTYgMi42OS02IDZzMi42OSA2IDYgNiA2LTIuNjkgNi02LTIuNjktNi02LTZ6IiBmaWxsPSIjMjU2M2ViIi8+Cjwvc3ZnPg=='
      },
      {
        action: 'close',
        title: '關閉',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE5IDYuNDFMNy41OSAxNy44M0w2LjE3IDE2LjQxTDE3LjU5IDUuMDlMMTkgNi40MXoiIGZpbGw9IiM2NjY2NjYiLz4KPHBhdGggZD0iTTYuNDEgNi40MUwxNy44MyAxNy44M0wxNi40MSAxOS4yNUw1LjA5IDcuODNMNi40MSA2LjQxeiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4='
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('跳繩平台', options)
  );
});

// 處理通知點擊
self.addEventListener('notificationclick', event => {
  console.log('通知被點擊:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'explore') {
    // 點擊「查看詳情」
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // 點擊「關閉」
    console.log('通知已關閉');
  } else {
    // 點擊通知本身
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 處理通知關閉
self.addEventListener('notificationclose', event => {
  console.log('通知已關閉:', event.notification.tag);
}); 