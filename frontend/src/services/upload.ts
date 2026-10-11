import { request } from "./http";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadService = {
  /** Envia a imagem ao backend, que devolve a URL pública armazenada. */
  image: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await request<{ url: string }>("/admin/uploads", { method: "POST", formData, admin: true, timeoutMs: 60_000 });
    return res.url;
  },
};
