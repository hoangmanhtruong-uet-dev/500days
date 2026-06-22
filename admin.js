// MẬT KHẨU ADMIN MẶC ĐỊNH
const ADMIN_PASSWORD = 'admin';

// ========== CẤU HÌNH CLOUDINARY ==========
// LẤY CÁC GIÁ TRỊ NÀY TỪ CLOUDINARY DASHBOARD (https://cloudinary.com/console)
const CLOUDINARY_CLOUD_NAME = 'dazqom6ix'; // Ví dụ: 'dungnt' (tên cloud)
const CLOUDINARY_UPLOAD_PRESET = '500days'; // Ví dụ: 'my_preset' (unsigned)

// ========== HÀM UPLOAD ẢNH LÊN CLOUDINARY ==========
async function uploadImageToCloudinary(file) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Chưa cấu hình Cloudinary. Vui lòng cập nhật CLOUDINARY_CLOUD_NAME và CLOUDINARY_UPLOAD_PRESET trong file admin.js');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload ảnh thất bại');
    }

    const result = await response.json();
    return result.secure_url; // Trả về URL công khai của ảnh trên Cloudinary
  } catch (error) {
    console.error('Lỗi upload lên Cloudinary:', error);
    throw error;
  }
}

let allMemories = [];
let currentUploadedImages = [];
let currentFiles = []; // Lưu trữ file objects chưa upload

// Các thành phần DOM
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const btnLogout = document.getElementById('btn-logout');
const btnResetDb = document.getElementById('btn-reset-db');
const btnAddNew = document.getElementById('btn-add-new');
const btnCancel = document.getElementById('btn-cancel');

const milestonesList = document.getElementById('milestones-list');
const formContainer = document.getElementById('form-container');
const welcomePanel = document.getElementById('welcome-panel');

const milestoneForm = document.getElementById('milestone-form');
const formTitle = document.getElementById('form-title');
const inputId = document.getElementById('milestone-id');
const inputDay = document.getElementById('milestone-day');
const inputDuration = document.getElementById('milestone-duration');
const inputTitle = document.getElementById('milestone-title');
const inputDesc = document.getElementById('milestone-desc');
const inputImageUpload = document.getElementById('image-upload');
const imagePreviewsContainer = document.getElementById('image-previews');

// --- XỬ LÝ ĐĂNG NHẬP & BẢO MẬT ---

function checkAuth() {
  const isAuth = localStorage.getItem('admin_authenticated') === 'true';
  if (isAuth) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loadMilestones();
  } else {
    loginSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const password = passwordInput.value;
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem('admin_authenticated', 'true');
    loginError.textContent = '';
    passwordInput.value = '';
    checkAuth();
  } else {
    loginError.textContent = 'Mật khẩu không chính xác! Hãy thử lại.';
  }
});

btnLogout.addEventListener('click', () => {
  localStorage.removeItem('admin_authenticated');
  checkAuth();
});

// --- TẢI VÀ HIỂN THỊ DANH SÁCH ---

async function loadMilestones() {
  try {
    allMemories = await getMemoriesFromDB();
    renderMilestonesList();
  } catch (error) {
    console.error('Lỗi khi tải hành trình:', error);
    alert('Không thể tải danh sách kỷ niệm từ IndexedDB.');
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (!dateStr.includes('-')) return dateStr;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function renderMilestonesList() {
  milestonesList.innerHTML = '';
  
  if (allMemories.length === 0) {
    milestonesList.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-sub);">Chưa có kỷ niệm nào. Bấm "Thêm Mới" để tạo!</div>';
    return;
  }

  allMemories.forEach((item) => {
    const activeClass = inputId.value === item.id ? 'active' : '';
    const itemEl = document.createElement('div');
    itemEl.className = `milestone-item ${activeClass}`;
    itemEl.setAttribute('data-id', item.id);
    
    // Tạo chuỗi mô tả ngắn
    const shortDesc = item.description.length > 55 ? item.description.substring(0, 52) + '...' : item.description;
    
    itemEl.innerHTML = `
      <div class="milestone-info">
        <div class="date">${formatDate(item.day)}</div>
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="preview-text">${escapeHtml(shortDesc)}</div>
      </div>
      <div class="milestone-actions">
        <button class="edit-btn" title="Chỉnh sửa" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.002 1.002 0 0 0 0-1.41l-2.34-2.34a1.002 1.002 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="delete-btn" title="Xóa" type="button">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    `;

    // Click vào item để sửa
    itemEl.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      startEdit(item.id);
    });

    // Nút Xóa
    const btnDel = itemEl.querySelector('.delete-btn');
    btnDel.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDelete(item.id, item.title);
    });

    milestonesList.appendChild(itemEl);
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

// --- THÊM / SỬA / XÓA ---

btnAddNew.addEventListener('click', () => {
  document.querySelectorAll('.milestone-item').forEach(el => el.classList.remove('active'));
  
  formTitle.textContent = 'Thêm Kỷ Niệm Mới';
  inputId.value = '';
  inputDay.value = new Date().toISOString().split('T')[0];
  inputDuration.value = 5;
  inputTitle.value = '';
  inputDesc.value = '';
  currentUploadedImages = [];
  currentFiles = [];
  renderImagePreviews();

  welcomePanel.style.display = 'none';
  formContainer.style.display = 'block';
});

function startEdit(id) {
  const item = allMemories.find(m => m.id === id);
  if (!item) return;

  document.querySelectorAll('.milestone-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-id') === id);
  });

  formTitle.textContent = 'Chỉnh Sửa Kỷ Niệm';
  inputId.value = item.id;
  inputDay.value = item.day;
  inputDuration.value = item.duration || 5;
  inputTitle.value = item.title;
  inputDesc.value = item.description;

  // Chuyển đổi các URL đã lưu (Cloudinary) thành object preview
  currentUploadedImages = (item.images || []).map(url => ({
    _localUrl: null,
    _file: null,
    url: url,
    _isUploaded: true
  }));
  currentFiles = [];
  renderImagePreviews();

  welcomePanel.style.display = 'none';
  formContainer.style.display = 'block';
  
  formContainer.scrollIntoView({ behavior: 'smooth' });
}

btnCancel.addEventListener('click', () => {
  formContainer.style.display = 'none';
  welcomePanel.style.display = 'flex';
  document.querySelectorAll('.milestone-item').forEach(el => el.classList.remove('active'));
  currentFiles = [];
});

// === XỬ LÝ SUBMIT FORM - UPLOAD ẢNH LÊN CLOUDINARY TRƯỚC KHI LƯU ===
milestoneForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Kiểm tra Cloudinary đã được cấu hình chưa
  if (currentFiles.length > 0 && (CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME' || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET')) {
    alert('⚠️ BẠN CẦN CẤU HÌNH CLOUDINARY TRƯỚC!\n\nVui lòng:\n1. Vào https://cloudinary.com/console đăng ký tài khoản\n2. Lấy Cloud Name từ Dashboard\n3. Tạo Upload Preset (dạng unsigned) trong Settings > Upload\n4. Cập nhật các giá trị vào đầu file admin.js');
    return;
  }

  const id = inputId.value || 'custom-' + Date.now();
  const day = inputDay.value;
  const duration = parseInt(inputDuration.value, 10) || 5;
  const title = inputTitle.value.trim();
  const description = inputDesc.value.trim();

  // === Upload những ảnh chưa upload lên Cloudinary ===
  const filesToUpload = currentFiles.slice();
  let uploadedUrls = [];

  if (filesToUpload.length > 0) {
    const submitBtn = milestoneForm.querySelector('button[type="submit"]');
    const cancelBtn = document.getElementById('btn-cancel');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang upload ảnh lên Cloudinary...';
    cancelBtn.disabled = true;

    try {
      let uploadedCount = 0;
      for (const file of filesToUpload) {
        const url = await uploadImageToCloudinary(file);
        uploadedUrls.push(url);
        uploadedCount++;
      }
    } catch (error) {
      alert('Lỗi khi upload ảnh lên Cloudinary: ' + error.message + '\n\nVui lòng kiểm tra cấu hình Cloudinary và thử lại.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Lưu Thay Đổi';
      cancelBtn.disabled = false;
      return;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Lưu Thay Đổi';
    cancelBtn.disabled = false;
  }

  // === Gộp URLs cũ (Cloudinary) + URLs mới ===
  const existingUrls = currentUploadedImages
    .filter(item => item._isUploaded)
    .map(item => item.url);

  const images = [...existingUrls, ...uploadedUrls];

  const newMilestone = { id, day, duration, title, description, images };

  try {
    const existingIndex = allMemories.findIndex(m => m.id === id);
    if (existingIndex > -1) {
      allMemories[existingIndex] = newMilestone;
    } else {
      allMemories.push(newMilestone);
    }

    await saveMemoriesToDB(allMemories);

    formContainer.style.display = 'none';
    welcomePanel.style.display = 'flex';
    currentFiles = [];

    await loadMilestones();
  } catch (error) {
    console.error('Lỗi khi lưu kỷ niệm:', error);
    alert('Không thể lưu kỷ niệm. Hãy thử lại.');
  }
});

async function confirmDelete(id, title) {
  const ok = confirm(`Bạn có chắc chắn muốn xóa kỷ niệm "${title}" không? Hành động này không thể hoàn tác.`);
  if (!ok) return;

  try {
    allMemories = allMemories.filter(m => m.id !== id);
    await saveMemoriesToDB(allMemories);
    
    if (inputId.value === id) {
      formContainer.style.display = 'none';
      welcomePanel.style.display = 'flex';
    }
    
    await loadMilestones();
  } catch (error) {
    console.error('Lỗi khi xóa kỷ niệm:', error);
    alert('Không thể xóa kỷ niệm.');
  }
}

// Reset cơ sở dữ liệu về mặc định
btnResetDb.addEventListener('click', async () => {
  const ok = confirm('Bạn có chắc muốn KHÔI PHỤC TOÀN BỘ kỷ niệm về trạng thái mặc định không? Mọi kỷ niệm bạn tự thêm hoặc sửa đổi sẽ bị xóa hoàn toàn.');
  if (!ok) return;

  try {
    await resetDefaultMemoriesInDB();
    formContainer.style.display = 'none';
    welcomePanel.style.display = 'flex';
    await loadMilestones();
    alert('Khôi phục dữ liệu mặc định thành công!');
  } catch (error) {
    console.error('Lỗi reset database:', error);
    alert('Khôi phục thất bại.');
  }
});

// --- XỬ LÝ TẢI ẢNH LÊN (PREVIEW LOCAL, SAU ĐÓ UPLOAD LÊN CLOUDINARY KHI LƯU) ---

inputImageUpload.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
  if (!files.length) return;

  files.forEach((file) => {
    // Dùng URL.createObjectURL để tạo preview (không lưu base64)
    const localUrl = URL.createObjectURL(file);
    currentUploadedImages.push({
      _localUrl: localUrl,
      _file: file,
      url: localUrl,
      _isUploaded: false
    });
    currentFiles.push(file);
  });

  renderImagePreviews();
  inputImageUpload.value = '';
});

function renderImagePreviews() {
  imagePreviewsContainer.innerHTML = '';
  
  currentUploadedImages.forEach((item, index) => {
    const imgSrc = item._localUrl || item.url;
    const previewEl = document.createElement('div');
    previewEl.className = 'preview-item';
    previewEl.innerHTML = `
      <img src="${imgSrc}" alt="Ảnh xem trước" />
      <button class="remove-btn" type="button" title="Xóa ảnh">&times;</button>
    `;

    previewEl.querySelector('.remove-btn').addEventListener('click', () => {
      if (item._localUrl) URL.revokeObjectURL(item._localUrl);
      currentUploadedImages.splice(index, 1);
      if (item._file) {
        const fileIndex = currentFiles.indexOf(item._file);
        if (fileIndex > -1) currentFiles.splice(fileIndex, 1);
      }
      renderImagePreviews();
    });

    imagePreviewsContainer.appendChild(previewEl);
  });
}

// Chạy khởi tạo
checkAuth();