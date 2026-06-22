# 500 Days of Love 💕

Trang web kỷ niệm 500 ngày yêu nhau của **Athune & MtruongDayy**.

## Cấu trúc

- `index.html` - Trang chủ
- `journey.html` - Hành trình tình yêu
- `gift.html` - Quà tặng
- `birthday.html` - Sinh nhật
- `admin.html` - Trang quản trị
- `style.css`, `journey.css`, `admin.css` - Stylesheets
- `script.js`, `journey.js`, `admin.js` - JavaScript
- `db.js` - IndexedDB (lưu dữ liệu trên trình duyệt)

## Deploy lên Render

### Cách 1: Render Static Site (khuyên dùng)
1. Push code lên GitHub
2. Vào [dashboard.render.com](https://dashboard.render.com)
3. Chọn **New +** > **Static Site**
4. Kết nối repository GitHub
5. Settings mặc định (Build Command để trống, Publish Directory là `.`)
6. Deploy

### Cách 2: Render Web Service (dùng npx serve)
1. Push code lên GitHub
2. Vào [dashboard.render.com](https://dashboard.render.com)
3. Chọn **New +** > **Web Service**
4. Kết nối repository GitHub
5. Start Command: `npx serve .`
6. Deploy