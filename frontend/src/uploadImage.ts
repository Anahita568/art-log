import { API_ORIGIN } from "./config";

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_ORIGIN}/api/images`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body: { error?: string } | null = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Image upload failed");
  }

  const { url }: { url: string } = await response.json();
  return url;
}
