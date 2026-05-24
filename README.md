# Karela

Ứng dụng hỗ trợ Scrum Team.

## Hướng dẫn cài đặt

### Tổng quan

Trước khi chạy ứng dụng, bạn cần hoàn thành 3 việc sau:

1. Cấu hình file môi trường cho backend.
2. Tạo và liên kết Jira app nếu bạn dùng tính năng Jira.
3. Chạy backend và frontend.

Các bước dưới đây được tách riêng để bạn có thể làm lần lượt.

### 1. Tạo file `.env` cho backend

Mở terminal và chuyển vào thư mục backend:

```bash
cd src/backend
```

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Sau đó mở file [src/backend/.env](src/backend/.env) và điền giá trị vào đúng dòng, ngay sau dấu `=`.

Các biến cần chú ý:

- `LLM_PROVIDER`: chọn `gemini` hoặc `openai`.
- `GEMINI_API_KEYS`: chỉ điền khi `LLM_PROVIDER=gemini`.
- `OPENAI_API_KEYS`: chỉ điền khi `LLM_PROVIDER=openai`.
- `MINERU_TOKEN`: cần nếu bạn dùng tính năng liên quan đến MinerU.

Bạn lấy các giá trị này ở đâu:

- `GEMINI_API_KEYS`: lấy tại https://aistudio.google.com/. Có thể nhập nhiều key, ngăn cách bằng dấu phẩy.
- `OPENAI_API_KEYS`: lấy tại https://platform.openai.com/. Có thể nhập nhiều key, ngăn cách bằng dấu phẩy.
- `MINERU_TOKEN`: lấy tại http://mineru.net/.

Ví dụ:

```dotenv
LLM_PROVIDER=gemini
GEMINI_API_KEYS=key_1,key_2
MINERU_TOKEN=your_token_here
```

### 2. Cấu hình Jira app

Phần này chỉ cần làm nếu bạn muốn dùng tính năng Jira.

#### 2.1. Tạo app Jira và lấy Client ID / Secret

1. Vào https://developer.atlassian.com/console/myapps.
2. Tạo một Jira app mới.
3. Chọn app vừa tạo.
4. Mở mục **Settings**.
5. Copy `client id` và `secret` vào đúng hai biến dưới đây trong file [src/backend/.env](src/backend/.env):

```dotenv
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
```

#### 2.2. Cấu hình OAuth callback và webhook URL

Bạn cần một **public domain** để Jira có thể gọi vào backend. Ví dụ, nếu backend của bạn chạy ở `https://api.example.com`, thì các URL phải dùng đúng domain đó.

Điền hai biến dưới đây trong file [src/backend/.env](src/backend/.env) bằng domain thật của bạn:

```dotenv
JIRA_OAUTH_URL=https://your-backend-domain/api/v1/integrations/jira/oauth/callback
JIRA_WEBHOOK_URL=https://your-backend-domain/api/v1/integrations/jira/webhook
```

Sau đó quay lại https://developer.atlassian.com/console/myapps và làm tiếp:

1. Chọn app vừa tạo.
2. Mở mục **Authorization**.
3. Chọn **Configure**.
4. Dán cả 2 URL trên vào trường **Callback URLs**.

### 3. Chạy backend

Bạn có thể chọn **một trong hai cách** dưới đây.

#### Cách 1: Chỉ dùng Docker

Đây là cách đơn giản nhất nếu bạn chỉ cần chạy ứng dụng.

```bash
cd src/backend
docker compose up --build
```

#### Cách 2: Chạy thủ công để linh hoạt hơn, bao gồm test

Cách này phù hợp nếu bạn muốn debug hoặc chạy test.

1. Tạo môi trường ảo Python.
2. Kích hoạt môi trường ảo.
3. Cài dependencies.
4. Chạy các service phụ trợ mà backend cần.
5. Chạy backend bằng `python main.py`.

```bash
cd src/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
docker compose -f docker-compose-services.yml up -d
python main.py
```

**Lưu ý:** trên Windows, cách này có thể gặp lỗi với Redis vì terminal không fork được như trên Linux.

### 4. Chạy frontend

#### Cách 1: Dùng Docker

```bash
cd src/frontend
docker compose up --build
```

#### Cách 2: Chạy thủ công

**Máy cần có Node.js.**

Nếu bạn muốn chạy bản production:

```bash
cd src/frontend
npm run build
npm run start
```

Nếu bạn muốn vừa chạy vừa chỉnh code:

```bash
npm run dev
```

### 5. Truy cập ứng dụng

Mở trình duyệt tại http://localhost:3000 để sử dụng ứng dụng.
