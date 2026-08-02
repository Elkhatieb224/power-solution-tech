window.PST_API_URL = window.PST_API_URL || "";

const DEFAULT_REMOTE_API = "https://sitesoftwear.vercel.app";

export function getApiUrl() {
  if (window.PST_API_URL) {
    return window.PST_API_URL.replace(/\/$/, "");
  }

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    if (location.port === "3001") {
      return `${location.protocol}//${location.host}`;
    }
    return "http://localhost:3001";
  }

  if (location.hostname.endsWith(".github.io")) {
    return DEFAULT_REMOTE_API;
  }

  return `${location.protocol}//${location.host}`.replace(/\/$/, "");
}

export const CATEGORY_LABELS = {
  web: "ويب",
  systems: "أنظمة",
  apps: "تطبيقات",
};

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function resolveImageUrl(imageUrl, apiUrl = getApiUrl()) {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/uploads/") && apiUrl) {
    return `${apiUrl}${imageUrl}`;
  }

  return imageUrl;
}
