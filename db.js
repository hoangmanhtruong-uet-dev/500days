const DB_NAME = 'JourneyDatabase';
const DB_VERSION = 2;
const STORE_NAME = 'memories';

const DB_DEFAULT_MILESTONES = [
  {
    id: 'default-1',
    day: '2025-10-02',
    title: 'Lần Đầu Gặp Nhau',
    images: [],
    description: 'Khoảnh khắc đầu tiên nhìn thấy nhau, mọi thứ bắt đầu thật nhẹ nhàng nhưng rất đặc biệt.',
    duration: 5
  },
  {
    id: 'default-2',
    day: '2025-01-10',
    title: 'Buổi Hẹn Hò Đầu Tiên',
    images: [],
    description: 'Một buổi hẹn có thật nhiều câu chuyện, nụ cười và cảm giác muốn ở cạnh nhau lâu hơn.',
    duration: 5
  },
  {
    id: 'default-3',
    day: '2025-02-03',
    title: 'Lời Tỏ Tình',
    images: [],
    description: 'Từ ngày ấy, chúng ta có thêm một người để nhớ, để thương và để chọn ở lại.',
    duration: 5
  },
  {
    id: 'default-4',
    day: '2025-04-13',
    title: '100 Ngày Hạnh Phúc',
    images: [],
    description: 'Cột mốc nhỏ đầu tiên, nhưng đủ làm trái tim thấy ấm áp mỗi khi nhớ lại.',
    duration: 5
  },
  {
    id: 'default-5',
    day: '2025-07-21',
    title: 'Chuyến Đi Cùng Nhau',
    images: [],
    description: 'Mỗi nơi đi qua đều trở thành một phần đáng yêu trong câu chuyện của chúng ta.',
    duration: 5
  },
  {
    id: 'default-6',
    day: '2026-01-03',
    title: 'Tròn 1 Năm',
    images: [],
    description: 'Một năm có vui, có nhớ, có những ngày chưa dễ dàng, nhưng mình vẫn bên nhau.',
    duration: 5
  },
  {
    id: 'default-7',
    day: '2026-06-18',
    title: '500 Ngày Yêu Thương',
    images: [],
    description: 'Nửa ngàn ngày không chỉ là một con số, mà là một lời nhắc rằng chuyện của mình vẫn đang đẹp lên.',
    duration: 5
  }
];

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

function getMemoriesFromDB() {
  return initDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = request.result || [];
      if (!list.length) {
        saveMemoriesToDB(DB_DEFAULT_MILESTONES)
          .then(() => resolve(JSON.parse(JSON.stringify(DB_DEFAULT_MILESTONES))))
          .catch(() => resolve(JSON.parse(JSON.stringify(DB_DEFAULT_MILESTONES))));
        return;
      }

      resolve(list.map(item => ({
        ...item,
        images: item.images || [],
        duration: item.duration || 5
      })).sort((a, b) => new Date(a.day) - new Date(b.day)));
    };

    request.onerror = () => reject(request.error);
  }));
}

function saveMemoriesToDB(memories) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      if (!memories.length) {
        resolve();
        return;
      }

      let done = 0;
      memories.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          done += 1;
          if (done === memories.length) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    };

    clearRequest.onerror = () => reject(clearRequest.error);
  }));
}

function resetDefaultMemoriesInDB() {
  return saveMemoriesToDB(DB_DEFAULT_MILESTONES);
}
