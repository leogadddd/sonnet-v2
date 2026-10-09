export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export function imageType(
  bytes: Uint8Array,
): { mime: string; extension: string } | null {
  const start = (signature: number[]) =>
    signature.every((value, index) => bytes[index] === value);
  if (start([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { mime: "image/png", extension: "png" };
  if (start([0xff, 0xd8, 0xff]))
    return { mime: "image/jpeg", extension: "jpg" };
  const text = new TextDecoder().decode(bytes.slice(0, 12));
  if (text.startsWith("GIF87a") || text.startsWith("GIF89a"))
    return { mime: "image/gif", extension: "gif" };
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP")
    return { mime: "image/webp", extension: "webp" };
  return null;
}
export async function readImage(request: Request): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES)
    throw new Error("Image exceeds 20 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Choose an image.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("Image exceeds 20 MB.");
    }
    chunks.push(value);
  }
  if (!size) throw new Error("Choose an image.");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
