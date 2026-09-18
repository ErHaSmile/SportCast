/** 本地文件或对象存储上的 mp4/webm 等，走原生 video，不走 HLS */
export function isNativeVideoUrl(url: string, type?: string) {
  if (type === "FILE" || type === "MP4" || type === "VIDEO") return true;
  const path = url.split("?")[0].toLowerCase();
  if (path.includes("/uploads/videos/")) return true;
  if (path.includes("/videos/") && /\.(mp4|webm|mov|m4v|ogg)$/.test(path)) return true;
  return /\.(mp4|webm|mov|m4v|ogg)$/.test(path);
}
