// src/backend/index.ts
import api, { route } from "@forge/api";

// (Khuyên dùng) Lưu secret/token của backend trong biến môi trường Forge:
// forge variables set BACKEND_API_KEY=xxx
const BACKEND_BASE = "https://abc123.ngrok.io"; // cập nhật khi ngrok đổi

type InvokePayload = {
  path: string,
  body?: any,
};

export async function getData({ payload }: { payload: InvokePayload }) {
  const url = `${BACKEND_BASE}${payload.path}`;
  const res = await api.fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      // Ví dụ thêm auth nếu backend yêu cầu:
      Authorization: `Bearer ${process.env.BACKEND_API_KEY ?? ""}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function postData({ payload }: { payload: InvokePayload }) {
  const url = `${BACKEND_BASE}${payload.path}`;
  const res = await api.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.BACKEND_API_KEY ?? ""}`,
    },
    body: JSON.stringify(payload.body ?? {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Map tên method với manifest (invoke('getData') / invoke('postData'))
export const run = {
  getData,
  postData,
};
