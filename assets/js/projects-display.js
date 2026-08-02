import { getApiUrl, categoryLabel, resolveImageUrl } from "./pst-config.js";

const CATEGORY_LABELS = categoryLabel;

function renderProjectCard(project) {
  const img = resolveImageUrl(project.image_url);
  const tag = categoryLabel(project.category);

  return `
    <article class="premium-project-card" data-category="${project.category}" style="background-image: url('${img}')">
      <div class="premium-project-card__content">
        <span class="premium-project-card__tag">${tag}</span>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
      </div>
    </article>`;
}

function renderHomeProjectCard(project) {
  const img = resolveImageUrl(project.image_url);
  const tag = categoryLabel(project.category);

  return `
    <article class="premium-project-card" data-category="${project.category}" style="background-image: url('${img}')">
      <div class="premium-project-card__content">
        <span class="premium-project-card__tag">${tag}</span>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
      </div>
    </article>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function loadProjectsGrid(container, options = {}) {
  if (!container) {
    return;
  }

  const limit = options.limit || 0;
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/projects`);

    if (!response.ok) {
      throw new Error("fetch failed");
    }

    const projects = await response.json();
    const list = limit > 0 ? projects.slice(0, limit) : projects;

    if (!list.length) {
      container.innerHTML = `<p class="pst-projects-empty">لا توجد مشاريع حالياً.</p>`;
      return;
    }

    const renderer = options.layout === "home" ? renderHomeProjectCard : renderProjectCard;
    container.innerHTML = list.map(renderer).join("");

    if (typeof options.onRendered === "function") {
      options.onRendered(list);
    }
  } catch {
    if (options.keepFallback !== false) {
      return;
    }
    container.innerHTML = `<p class="pst-projects-empty">تعذر تحميل المشاريع. تأكد من تشغيل الخادم.</p>`;
  }
}

function initProjectFilterButtons(grid) {
  const targetGrid = grid || document.querySelector(".premium-projects-grid");
  const buttons = document.querySelectorAll(".premium-filter button");

  if (!targetGrid || !buttons.length) {
    return;
  }

  const items = () => targetGrid.querySelectorAll("[data-category]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;

      items().forEach((item) => {
        const show = filter === "*" || item.dataset.category === filter;
        item.style.display = show ? "" : "none";
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pageGrid = document.getElementById("pst-projects-grid");
  const homeGrid = document.getElementById("pst-home-projects-grid");
  const activeGrid = pageGrid || homeGrid;

  if (activeGrid) {
    initProjectFilterButtons(activeGrid);
  }

  if (pageGrid) {
    loadProjectsGrid(pageGrid, {
      onRendered: () => initProjectFilterButtons(pageGrid),
      keepFallback: true,
    });
  }

  if (homeGrid) {
    loadProjectsGrid(homeGrid, {
      limit: 6,
      layout: "home",
      onRendered: () => initProjectFilterButtons(homeGrid),
      keepFallback: true,
    });
  }
});
