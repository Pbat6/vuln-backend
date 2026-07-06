# Vuln Backend — Pentest Lab API

Backend API cho website chỉnh sửa ảnh, xây dựng bằng **NestJS**. Dự án chứa **6 lỗ hổng bảo mật có chủ đích** để thực hành pentest. Chỉ dùng trong môi trường lab/isolated — **không deploy lên production**.

## Tính năng

- Đăng ký / đăng nhập (JWT RS256)
- 2 role: `user` và `admin`
- Khám phá ảnh ngẫu nhiên (đồng bộ từ [picsum.photos](https://picsum.photos))
- Upload, download, chỉnh sửa ảnh (ImageMagick)
- Cấu hình giao diện (theme) theo từng user
- MySQL chạy trong Docker

## Yêu cầu hệ thống

| Thành phần | Phiên bản |
|------------|-----------|
| Node.js | 18+ |
| npm | 9+ |
| Docker & Docker Compose | Mới nhất |
| ImageMagick | Đã cài trên máy host |

Kiểm tra ImageMagick:

```bash
magick -version
# Linux có thể dùng lệnh: convert -version
```

## Cài đặt

### 1. Clone và cài dependencies

```bash
git clone <repo-url>
cd vuln-backend
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Chỉnh sửa `.env` nếu cần (mặc định đã sẵn sàng cho Docker MySQL local):

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=vuln_lab
JWT_PRIVATE_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem
UPLOAD_DIR=uploads
IMAGEMAGICK_CMD=magick
```

> Trên Linux, nếu lệnh ImageMagick là `convert` thay vì `magick`, đặt `IMAGEMAGICK_CMD=convert`.

### 3. Tạo RSA keypair (nếu chưa có)

```bash
# Cách 1: OpenSSL
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Cách 2: Node.js (Windows không có OpenSSL)
node -e "const {generateKeyPairSync}=require('crypto');const fs=require('fs');const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});fs.mkdirSync('keys',{recursive:true});fs.writeFileSync('keys/private.pem',privateKey);fs.writeFileSync('keys/public.pem',publicKey);console.log('OK');"
```

### 4. Khởi động MySQL

```bash
docker compose up -d
```

Kiểm tra container:

```bash
docker compose ps
```

### 5. Chạy API

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm run start:prod
```

Server mặc định: **http://localhost:3001**

## Tài khoản mặc định

Ứng dụng tự seed khi khởi động lần đầu:

| Email | Password | Role |
|-------|----------|------|
| `admin@lab.local` | `admin123` | admin |
| `user@lab.local` | `user123` | user |

## Cấu trúc thư mục

```
vuln-backend/
├── docker-compose.yml
├── .env.example
├── keys/                   # RSA keypair (private.pem không commit)
├── uploads/                # Tất cả ảnh (upload + edit) — serve static tại /uploads
└── src/
    ├── entities/           # Tất cả TypeORM entities (4 bảng)
    ├── auth/               # Auth + Users (admin) trong 1 module
    ├── images/             # 1 service gộp upload/edit/explore
    ├── settings/           # Cấu hình theme
    ├── common/             # Guards, filters, utils
    ├── config/
    └── database/           # TypeORM + seed
```

## API Reference

Tất cả endpoint API có prefix `/api`. File upload được serve trực tiếp tại `/uploads` (không qua prefix).

### Response format

**Thành công** (mọi endpoint JSON):

```json
{
  "success": true,
  "data": { }
}
```

**Lỗi:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Mô tả lỗi"
}
```

Ngoại lệ: `GET /api/images/:id/download` trả **binary file**, không bọc JSON.

Lỗi SQLi (lab) trả thêm `sql`, `code`:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "You have an error in your SQL syntax...",
  "error": "Database Error",
  "sql": "SELECT * FROM ...",
  "code": "ER_PARSE_ERROR"
}
```

### Health check

```http
GET /api/health
```

### Auth

```http
POST /api/auth/register
Content-Type: application/json

{ "email": "test@lab.local", "password": "test123" }
```

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "user@lab.local", "password": "user123" }
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "user@lab.local",
    "role": "user",
    "access_token": "<JWT>"
  }
}
```

```http
GET /api/auth/me
Authorization: Bearer <JWT>
```

### Images

#### Khám phá ảnh (public)

```http
GET /api/images/explore
GET /api/images/explore?search=nature
```

#### Ảnh của tôi (cần JWT)

```http
GET /api/images/my
GET /api/images/my?search=photo
Authorization: Bearer <JWT>
```

#### Upload ảnh

```http
POST /api/images/upload
Authorization: Bearer <JWT>
Content-Type: multipart/form-data

file: <file>
title: (optional)
description: (optional)
```

Ví dụ curl:

```bash
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@image.png" \
  -F "title=My Photo"
```

#### Chi tiết ảnh

```http
GET /api/images/:id
Authorization: Bearer <JWT>
```

#### Download ảnh

```http
GET /api/images/:id/download?file=<filename>
Authorization: Bearer <JWT>
```

#### Chỉnh sửa ảnh (ImageMagick)

```http
POST /api/images/:id/edit
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "width": "800",
  "height": "600",
  "format": "png"
}
```

#### Truy cập file đã upload (static)

```http
GET /uploads/<filename>
```

### Settings — Cấu hình theme

```http
GET /api/settings/theme
Authorization: Bearer <JWT>
```

```http
PATCH /api/settings/theme
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "primaryColor": "#ff0000",
  "darkMode": true,
  "layout": { "sidebar": false }
}
```

### Diagnostics — Kiểm tra remote monitor

```http
GET /api/diagnostics
```

### Users — Admin only

```http
GET /api/users
Authorization: Bearer <ADMIN_TOKEN>
```

```http
DELETE /api/users/:id
Authorization: Bearer <ADMIN_TOKEN>
```

## Ví dụ workflow cơ bản

```bash
# 1. Đăng nhập
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@lab.local","password":"user123"}'

# 2. Lưu token và gọi API
TOKEN="<access_token từ bước 1>"

curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

curl http://localhost:3001/api/images/explore?search=nature

curl http://localhost:3001/api/images/my \
  -H "Authorization: Bearer $TOKEN"
```

## Lab Pentest — 6 lỗ hổng

| # | Loại | Endpoint / Vị trí | Gợi ý hướng khai thác |
|---|------|-------------------|------------------------|
| 1 | Path Traversal | `GET /api/images/:id/download?file=` | Thử `../` để đọc file ngoài thư mục `uploads/` |
| 2 | Upload → XSS | `POST /api/images/upload` + `GET /uploads/` | Upload file `.svg` / `.html` chứa script |
| 3 | Command Injection | `POST /api/images/:id/edit` | Inject qua tham số `width` / `height` trong lệnh ImageMagick |
| 4 | JWT JWK Injection | Header JWT | Forge token bằng cách nhúng JWK tự tạo vào header |
| 5a | SQL Injection (error-based) | `GET /api/images/explore?search=` | Payload SQL → response trả về lỗi syntax MySQL |
| 5b | SQL Injection (blind) | `GET /api/images/my?search=` | Không leak lỗi SQL — boolean-based qua số lượng kết quả (`data: []` vs có item) |
| 6 | Prototype Pollution → RCE | `PATCH /api/settings/theme` → `GET /api/diagnostics` | Deep merge không lọc `__proto__` → pollute `Object.prototype` → `diagnostics.service.ts` đọc `options.cmd` qua prototype chain → command injection |

> File triển khai lỗ hổng: `images.service.ts`, `jwt.strategy.ts`, `deep-merge.util.ts`, `settings.service.ts`, `diagnostics.service.ts`, `sql-error.filter.ts`.

## Scripts npm

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy development với hot reload |
| `npm run build` | Build production |
| `npm run start:prod` | Chạy bản build |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |

## Xử lý sự cố

### Port 3001 đã được sử dụng

```bash
# Windows
netstat -ano | findstr :3001

# Đổi port trong .env
PORT=3002
```

### Không kết nối được MySQL

```bash
docker compose ps
docker compose logs mysql
docker compose restart mysql
```

Đảm bảo `.env` khớp với `docker-compose.yml` (`root` / `root` / `vuln_lab`).

### ImageMagick không tìm thấy

```bash
magick -version
```

Cập nhật `IMAGEMAGICK_CMD` trong `.env` cho đúng lệnh trên hệ thống của bạn.

### bcrypt build lỗi

```bash
npm rebuild bcrypt
```

## Cảnh báo bảo mật

- **Không** expose ra internet hoặc mạng không tin cậy.
- **Không** dùng password seed trong môi trường thật.
- **Không** commit `keys/private.pem` hoặc file `.env`.
- Chỉ chạy trong VM / container lab có cô lập mạng.

## License

UNLICENSED — Dùng cho mục đích học tập và thực hành pentest.