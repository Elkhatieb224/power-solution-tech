import { getApiUrl, resolveImageUrl } from "./pst-config.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function starsHtml(rating) {
  const count = Math.min(5, Math.max(1, Number(rating) || 5));
  return Array.from({ length: count }, () => '<i class="fas fa-star"></i>').join("");
}

function applyClients(clients, label) {
  const labelEl = document.querySelector(".pst-clients-bar__label");
  if (labelEl && label) {
    labelEl.textContent = label;
  }

  const set = document.getElementById("pst-clients-set");
  if (!set || !clients?.length) return;

  set.innerHTML = clients
    .map(
      (client) => `
      <div class="single-client-face">
        <div class="client-face-img"><img src="${resolveImageUrl(client.image_url)}" alt="${escapeHtml(client.name)}"></div>
        <span>${escapeHtml(client.name)}</span>
      </div>`
    )
    .join("");

  if (typeof window.PST_rebuildClientsMarquee === "function") {
    window.PST_rebuildClientsMarquee();
  }
}

function applySettings(settings) {
  if (!settings) return;

  const aboutImg = document.getElementById("pst-about-image");
  if (aboutImg && settings.about_image) {
    aboutImg.src = resolveImageUrl(settings.about_image);
  }

  const contactImg = document.getElementById("pst-contact-image");
  if (contactImg && settings.contact_image) {
    contactImg.src = resolveImageUrl(settings.contact_image);
  }
}

function applyTestimonials(items) {
  const slider = document.getElementById("pst-testimonials-slider");
  if (!slider || !items?.length) return;

  slider.innerHTML = items
    .map(
      (item) => `
      <div class="pst-testimonial-card">
        <div class="pst-testimonial-card__stars">${starsHtml(item.rating)}</div>
        <p>«${escapeHtml(item.quote)}»</p>
        <div class="pst-testimonial-card__author">
          <div class="pst-testimonial-card__avatar" style="background-image: url('${resolveImageUrl(item.avatar_url)}')"></div>
          <div>
            <strong>${escapeHtml(item.author_name)}</strong>
            <span>${escapeHtml(item.author_role || "")}</span>
          </div>
        </div>
      </div>`
    )
    .join("");

  if (typeof window.PST_rebuildTestimonials === "function") {
    window.PST_rebuildTestimonials();
  }
}

function applyBlog(posts) {
  const grid = document.getElementById("pst-blog-grid");
  if (!grid || !posts?.length) return;

  grid.innerHTML = posts
    .map(
      (post) => `
      <div class="col-xl-4 col-md-6 col-12">
        <div class="single-news-box">
          <div class="featured-thumb bg-cover" style="background-image: url('${resolveImageUrl(post.image_url)}')">
            <div class="post-cat">
              <a href="${escapeHtml(post.link || "news-details.html")}">${escapeHtml(post.category || "مقال")}</a>
            </div>
          </div>
          <div class="content">
            <div class="meta d-flex">
              <div class="author me-2">
                <i class="fal fa-user"></i><a href="#">${escapeHtml(post.author || "Power Solution")}</a>
              </div>
              |
              <div class="date ms-2">
                <i class="fal fa-calendar-alt"></i>
                <span>${escapeHtml(post.date_label || "")}</span>
              </div>
            </div>
            <h3><a href="${escapeHtml(post.link || "news-details.html")}">${escapeHtml(post.title)}</a></h3>
            <a class="read-btn" href="${escapeHtml(post.link || "news-details.html")}">اقرأ المزيد</a>
          </div>
        </div>
      </div>`
    )
    .join("");
}

export async function loadHomeContent() {
  const apiUrl = getApiUrl();
  if (!apiUrl) return;

  try {
    const response = await fetch(`${apiUrl}/api/content`);
    if (!response.ok) throw new Error("content fetch failed");
    const data = await response.json();

    applySettings(data.settings);
    applyClients(data.clients, data.settings?.clients_label);
    applyTestimonials(data.testimonials);
    applyBlog(data.blog);
  } catch {
    // keep static HTML fallback
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHomeContent();
});
