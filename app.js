/* ==========================================
   Mahdi Online - M.O.1.0
   ========================================== */

const STORAGE_KEY = 'mahdi_online_data';

// ===== إدارة البيانات =====
function getData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { users: [], posts: [], currentUser: null };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ===== التبديل بين التبويبات =====
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));

    if (tab === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

// ===== إنشاء حساب =====
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUser').value.trim();
    const password = document.getElementById('signupPass').value;

    const data = getData();

    if (data.users.find(u => u.username === username)) {
        alert('⚠️ اسم المستخدم موجود مسبقاً');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        username,
        password,
        joinedAt: new Date().toISOString()
    };

    data.users.push(newUser);
    data.currentUser = newUser.id;
    saveData(data);

    alert('✅ تم إنشاء الحساب بنجاح!');
    showMainApp();
}

// ===== تسجيل الدخول =====
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    const data = getData();
    const user = data.users.find(u => u.username === username && u.password === password);

    if (!user) {
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
        return;
    }

    data.currentUser = user.id;
    saveData(data);
    showMainApp();
}

// ===== تسجيل الخروج =====
function logout() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    const data = getData();
    data.currentUser = null;
    saveData(data);
    location.reload();
}

// ===== عرض الواجهة الرئيسية =====
function showMainApp() {
    const data = getData();
    const user = data.users.find(u => u.id === data.currentUser);

    if (!user) return;

    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    document.getElementById('currentUser').textContent = user.name;
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileUser').textContent = '@' + user.username;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

    renderPosts();
    updateStats();
}

// ===== إنشاء منشور =====
let currentImageBase64 = null;

document.getElementById('postImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
        currentImageBase64 = ev.target.result;
        const preview = document.getElementById('imagePreview');
        preview.src = currentImageBase64;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

function createPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content && !currentImageBase64) {
        alert('⚠️ اكتب شيئاً أو أضف صورة');
        return;
    }

    const data = getData();
    const user = data.users.find(u => u.id === data.currentUser);

    const post = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        userUsername: user.username,
        content,
        image: currentImageBase64,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
    };

    data.posts.unshift(post);
    saveData(data);

    // تصفير الحقول
    document.getElementById('postContent').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    currentImageBase64 = null;

    renderPosts();
    updateStats();
}

// ===== عرض المنشورات =====
function renderPosts() {
    const data = getData();
    const list = document.getElementById('postsList');

    if (data.posts.length === 0) {
        list.innerHTML = '<div class="empty-feed">لا توجد منشورات بعد. كن أول من ينشر! 🚀</div>';
        return;
    }

    list.innerHTML = data.posts.map(post => {
        const isLiked = post.likes.includes(data.currentUser);
        const isOwner = post.userId === data.currentUser;

        return `
            <div class="post">
                <div class="post-header">
                    <div class="post-avatar">${post.userName.charAt(0).toUpperCase()}</div>
                    <div class="post-info">
                        <h4>${escapeHtml(post.userName)}</h4>
                        <span>@${escapeHtml(post.userUsername)} · ${timeAgo(post.createdAt)}</span>
                    </div>
                </div>
                ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ''}
                ${post.image ? `<img src="${post.image}" class="post-image" alt="post">` : ''}
                <div class="post-footer">
                    <button class="post-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                        ${isLiked ? '❤️' : '🤍'} ${post.likes.length}
                    </button>
                    <button class="post-btn" onclick="toggleComment(${post.id})">
                        💬 ${post.comments.length}
                    </button>
                    ${isOwner ? `<button class="post-btn delete-btn" onclick="deletePost(${post.id})">🗑️</button>` : ''}
                </div>
                <div id="comments-${post.id}" class="comments-section hidden"></div>
            </div>
        `;
    }).join('');
}

// ===== الإعجاب =====
function toggleLike(postId) {
    const data = getData();
    const post = data.posts.find(p => p.id === postId);
    if (!post) return;

    const index = post.likes.indexOf(data.currentUser);
    if (index === -1) {
        post.likes.push(data.currentUser);
    } else {
        post.likes.splice(index, 1);
    }

    saveData(data);
    renderPosts();
    updateStats();
}

// ===== حذف منشور =====
function deletePost(postId) {
    if (!confirm('هل تريد حذف هذا المنشور؟')) return;
    const data = getData();
    data.posts = data.posts.filter(p => p.id !== postId);
    saveData(data);
    renderPosts();
    updateStats();
}

// ===== التعليقات =====
function toggleComment(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (!section) return;

    if (section.classList.contains('hidden')) {
        const data = getData();
        const post = data.posts.find(p => p.id === postId);
        section.innerHTML = `
            <div class="comments-list">
                ${post.comments.map(c => `
                    <div class="comment">
                        <strong>${escapeHtml(c.userName)}:</strong> ${escapeHtml(c.text)}
                    </div>
                `).join('')}
            </div>
            <div class="comment-input">
                <input type="text" id="comment-${postId}" placeholder="اكتب تعليقاً...">
                <button onclick="addComment(${postId})">إرسال</button>
            </div>
        `;
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
}

function addComment(postId) {
    const input = document.getElementById(`comment-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    const data = getData();
    const user = data.users.find(u => u.id === data.currentUser);
    const post = data.posts.find(p => p.id === postId);

    post.comments.push({
        userName: user.name,
        text,
        createdAt: new Date().toISOString()
    });

    saveData(data);
    renderPosts();
    // إعادة فتح التعليقات
    setTimeout(() => {
        document.getElementById(`comments-${postId}`)?.classList.remove('hidden');
    }, 50);
}

// ===== الإحصائيات =====
function updateStats() {
    const data = getData();
    const userPosts = data.posts.filter(p => p.userId === data.currentUser);
    const totalLikes = userPosts.reduce((sum, p) => sum + p.likes.length, 0);

    document.getElementById('postsCount').textContent = userPosts.length;
    document.getElementById('likesCount').textContent = totalLikes;
}

// ===== دوال مساعدة =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds/60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds/3600)} ساعة`;
    return `منذ ${Math.floor(seconds/86400)} يوم`;
}

// ===== عند تحميل الصفحة =====
window.addEventListener('DOMContentLoaded', () => {
    const data = getData();
    if (data.currentUser) {
        showMainApp();
    }
});