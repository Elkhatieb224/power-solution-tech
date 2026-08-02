const AdminApp = (() => {
  const TOKEN_KEY = "pst_admin_token";
  const CATEGORY_LABELS = { web: "ويب", systems: "أنظمة", apps: "تطبيقات" };

  function getApiUrl() {
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
      return "https://sitesoftwear.vercel.app";
    }

    return `${location.protocol}//${location.host}`;
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function resolveImageUrl(imageUrl) {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("/uploads/")) return `${getApiUrl()}${imageUrl}`;
    if (imageUrl.startsWith("/")) return imageUrl;
    return imageUrl;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function login(username, password) {
    const response = await fetch(`${getApiUrl()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "فشل تسجيل الدخول");
    setToken(data.token);
    return data;
  }

  async function apiRequest(path, options = {}) {
    const headers = options.headers || {};

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || "حدث خطأ في الطلب");
    return data;
  }

  function guardLoginPage() {
    if (getToken()) window.location.href = "dashboard.html";
  }

  function guardDashboardPage() {
    if (!getToken()) window.location.href = "login.html";
  }

  function showMessage(id, text, isError = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    el.style.color = isError ? "#f87171" : "#86efac";
    setTimeout(() => {
      el.hidden = true;
    }, 3500);
  }

  function renderList(containerId, items, mapItem) {
    const list = document.getElementById(containerId);
    if (!items.length) {
      list.innerHTML = `<p style="color:#a1a1aa">لا توجد عناصر بعد.</p>`;
      return;
    }
    list.innerHTML = items.map(mapItem).join("");
  }

  /* ——— Tabs ——— */
  function initTabs() {
    const tabs = document.querySelectorAll(".admin-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => item.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".admin-tab-panel").forEach((panel) => {
          panel.classList.toggle("active", panel.dataset.panel === tab.dataset.tab);
        });
      });
    });
  }

  /* ——— Projects ——— */
  function resetProjectForm() {
    document.getElementById("project-form").reset();
    document.getElementById("project-id").value = "";
    document.getElementById("project-form-title").textContent = "إضافة مشروع جديد";
    document.getElementById("project-cancel").hidden = true;
    document.getElementById("project-image-hint").textContent = "مطلوبة عند الإضافة.";
  }

  async function loadProjects() {
    const projects = await apiRequest("/api/projects");
    renderList("projects-list", projects, (project) => `
      <article class="admin-project-item">
        <div class="admin-project-item__thumb" style="background-image:url('${resolveImageUrl(project.image_url)}')"></div>
        <div class="admin-project-item__meta">
          <span class="admin-project-item__tag">${CATEGORY_LABELS[project.category] || project.category}</span>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description || "")}</p>
        </div>
        <div class="admin-project-item__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-edit-project="${project.id}">تعديل</button>
          <button type="button" class="admin-btn admin-btn--danger" data-delete-project="${project.id}">حذف</button>
        </div>
      </article>`);

    document.querySelectorAll("[data-edit-project]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const project = projects.find((item) => item.id === Number(btn.dataset.editProject));
        if (!project) return;
        document.getElementById("project-id").value = project.id;
        document.getElementById("project-title").value = project.title;
        document.getElementById("project-description").value = project.description || "";
        document.getElementById("project-category").value = project.category;
        document.getElementById("project-sort").value = project.sort_order || 0;
        document.getElementById("project-form-title").textContent = "تعديل المشروع";
        document.getElementById("project-cancel").hidden = false;
        document.getElementById("project-image-hint").textContent = "اتركه فارغاً للإبقاء على الصورة الحالية.";
      });
    });

    document.querySelectorAll("[data-delete-project]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("حذف هذا المشروع؟")) return;
        try {
          await apiRequest(`/api/projects/${btn.dataset.deleteProject}`, { method: "DELETE" });
          await loadProjects();
          showMessage("project-message", "تم حذف المشروع.");
        } catch (error) {
          showMessage("project-message", error.message, true);
        }
      });
    });
  }

  async function saveProject(event) {
    event.preventDefault();
    const id = document.getElementById("project-id").value;
    const formData = new FormData();
    formData.append("title", document.getElementById("project-title").value.trim());
    formData.append("description", document.getElementById("project-description").value.trim());
    formData.append("category", document.getElementById("project-category").value);
    formData.append("sort_order", document.getElementById("project-sort").value || "0");
    const image = document.getElementById("project-image").files[0];
    if (image) formData.append("image", image);

    try {
      if (id) {
        await apiRequest(`/api/projects/${id}`, { method: "PUT", body: formData });
        showMessage("project-message", "تم تحديث المشروع.");
      } else {
        if (!image) {
          showMessage("project-message", "يرجى اختيار صورة.", true);
          return;
        }
        await apiRequest("/api/projects", { method: "POST", body: formData });
        showMessage("project-message", "تمت إضافة المشروع.");
      }
      resetProjectForm();
      await loadProjects();
    } catch (error) {
      showMessage("project-message", error.message, true);
    }
  }

  /* ——— Clients ——— */
  function resetClientForm() {
    document.getElementById("client-form").reset();
    document.getElementById("client-id").value = "";
    document.getElementById("client-form-title").textContent = "إضافة عميل";
    document.getElementById("client-cancel").hidden = true;
    document.getElementById("client-image-hint").textContent = "مطلوبة عند الإضافة.";
  }

  async function loadClients() {
    const clients = await apiRequest("/api/clients");
    renderList("clients-list", clients, (client) => `
      <article class="admin-project-item">
        <div class="admin-project-item__thumb" style="background-image:url('${resolveImageUrl(client.image_url)}')"></div>
        <div class="admin-project-item__meta">
          <h3>${escapeHtml(client.name)}</h3>
          <p>ترتيب: ${client.sort_order || 0}</p>
        </div>
        <div class="admin-project-item__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-edit-client="${client.id}">تعديل</button>
          <button type="button" class="admin-btn admin-btn--danger" data-delete-client="${client.id}">حذف</button>
        </div>
      </article>`);

    document.querySelectorAll("[data-edit-client]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const client = clients.find((item) => item.id === Number(btn.dataset.editClient));
        if (!client) return;
        document.getElementById("client-id").value = client.id;
        document.getElementById("client-name").value = client.name;
        document.getElementById("client-sort").value = client.sort_order || 0;
        document.getElementById("client-form-title").textContent = "تعديل العميل";
        document.getElementById("client-cancel").hidden = false;
        document.getElementById("client-image-hint").textContent = "اتركه فارغاً للإبقاء على الصورة الحالية.";
      });
    });

    document.querySelectorAll("[data-delete-client]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("حذف هذا العميل؟")) return;
        try {
          await apiRequest(`/api/clients/${btn.dataset.deleteClient}`, { method: "DELETE" });
          await loadClients();
          showMessage("client-message", "تم الحذف.");
        } catch (error) {
          showMessage("client-message", error.message, true);
        }
      });
    });
  }

  async function saveClient(event) {
    event.preventDefault();
    const id = document.getElementById("client-id").value;
    const formData = new FormData();
    formData.append("name", document.getElementById("client-name").value.trim());
    formData.append("sort_order", document.getElementById("client-sort").value || "0");
    const image = document.getElementById("client-image").files[0];
    if (image) formData.append("image", image);

    try {
      if (id) {
        await apiRequest(`/api/clients/${id}`, { method: "PUT", body: formData });
        showMessage("client-message", "تم تحديث العميل.");
      } else {
        if (!image) {
          showMessage("client-message", "يرجى اختيار صورة.", true);
          return;
        }
        await apiRequest("/api/clients", { method: "POST", body: formData });
        showMessage("client-message", "تمت إضافة العميل.");
      }
      resetClientForm();
      await loadClients();
    } catch (error) {
      showMessage("client-message", error.message, true);
    }
  }

  /* ——— Testimonials ——— */
  function resetTestimonialForm() {
    document.getElementById("testimonial-form").reset();
    document.getElementById("testimonial-id").value = "";
    document.getElementById("testimonial-rating").value = "5";
    document.getElementById("testimonial-form-title").textContent = "إضافة رأي عميل";
    document.getElementById("testimonial-cancel").hidden = true;
  }

  async function loadTestimonials() {
    const items = await apiRequest("/api/testimonials");
    renderList("testimonials-list", items, (item) => `
      <article class="admin-project-item">
        <div class="admin-project-item__thumb" style="background-image:url('${resolveImageUrl(item.avatar_url)}')"></div>
        <div class="admin-project-item__meta">
          <h3>${escapeHtml(item.author_name)}</h3>
          <p>${escapeHtml(item.quote)}</p>
        </div>
        <div class="admin-project-item__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-edit-testimonial="${item.id}">تعديل</button>
          <button type="button" class="admin-btn admin-btn--danger" data-delete-testimonial="${item.id}">حذف</button>
        </div>
      </article>`);

    document.querySelectorAll("[data-edit-testimonial]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = items.find((row) => row.id === Number(btn.dataset.editTestimonial));
        if (!item) return;
        document.getElementById("testimonial-id").value = item.id;
        document.getElementById("testimonial-quote").value = item.quote;
        document.getElementById("testimonial-author").value = item.author_name;
        document.getElementById("testimonial-role").value = item.author_role || "";
        document.getElementById("testimonial-rating").value = item.rating || 5;
        document.getElementById("testimonial-sort").value = item.sort_order || 0;
        document.getElementById("testimonial-form-title").textContent = "تعديل الشهادة";
        document.getElementById("testimonial-cancel").hidden = false;
      });
    });

    document.querySelectorAll("[data-delete-testimonial]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("حذف هذه الشهادة؟")) return;
        try {
          await apiRequest(`/api/testimonials/${btn.dataset.deleteTestimonial}`, { method: "DELETE" });
          await loadTestimonials();
          showMessage("testimonial-message", "تم الحذف.");
        } catch (error) {
          showMessage("testimonial-message", error.message, true);
        }
      });
    });
  }

  async function saveTestimonial(event) {
    event.preventDefault();
    const id = document.getElementById("testimonial-id").value;
    const formData = new FormData();
    formData.append("quote", document.getElementById("testimonial-quote").value.trim());
    formData.append("author_name", document.getElementById("testimonial-author").value.trim());
    formData.append("author_role", document.getElementById("testimonial-role").value.trim());
    formData.append("rating", document.getElementById("testimonial-rating").value || "5");
    formData.append("sort_order", document.getElementById("testimonial-sort").value || "0");
    const image = document.getElementById("testimonial-image").files[0];
    if (image) formData.append("image", image);

    try {
      if (id) {
        await apiRequest(`/api/testimonials/${id}`, { method: "PUT", body: formData });
        showMessage("testimonial-message", "تم تحديث الشهادة.");
      } else {
        await apiRequest("/api/testimonials", { method: "POST", body: formData });
        showMessage("testimonial-message", "تمت إضافة الشهادة.");
      }
      resetTestimonialForm();
      await loadTestimonials();
    } catch (error) {
      showMessage("testimonial-message", error.message, true);
    }
  }

  /* ——— Blog ——— */
  function resetBlogForm() {
    document.getElementById("blog-form").reset();
    document.getElementById("blog-id").value = "";
    document.getElementById("blog-link").value = "news-details.html";
    document.getElementById("blog-form-title").textContent = "إضافة مقال";
    document.getElementById("blog-cancel").hidden = true;
    document.getElementById("blog-image-hint").textContent = "مطلوبة عند الإضافة.";
  }

  async function loadBlog() {
    const posts = await apiRequest("/api/blog");
    renderList("blog-list", posts, (post) => `
      <article class="admin-project-item">
        <div class="admin-project-item__thumb" style="background-image:url('${resolveImageUrl(post.image_url)}')"></div>
        <div class="admin-project-item__meta">
          <span class="admin-project-item__tag">${escapeHtml(post.category || "مقال")}</span>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.author || "")} — ${escapeHtml(post.date_label || "")}</p>
        </div>
        <div class="admin-project-item__actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-edit-blog="${post.id}">تعديل</button>
          <button type="button" class="admin-btn admin-btn--danger" data-delete-blog="${post.id}">حذف</button>
        </div>
      </article>`);

    document.querySelectorAll("[data-edit-blog]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const post = posts.find((row) => row.id === Number(btn.dataset.editBlog));
        if (!post) return;
        document.getElementById("blog-id").value = post.id;
        document.getElementById("blog-title").value = post.title;
        document.getElementById("blog-category").value = post.category || "";
        document.getElementById("blog-author").value = post.author || "";
        document.getElementById("blog-date").value = post.date_label || "";
        document.getElementById("blog-link").value = post.link || "news-details.html";
        document.getElementById("blog-sort").value = post.sort_order || 0;
        document.getElementById("blog-form-title").textContent = "تعديل المقال";
        document.getElementById("blog-cancel").hidden = false;
        document.getElementById("blog-image-hint").textContent = "اتركه فارغاً للإبقاء على الصورة الحالية.";
      });
    });

    document.querySelectorAll("[data-delete-blog]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("حذف هذا المقال؟")) return;
        try {
          await apiRequest(`/api/blog/${btn.dataset.deleteBlog}`, { method: "DELETE" });
          await loadBlog();
          showMessage("blog-message", "تم الحذف.");
        } catch (error) {
          showMessage("blog-message", error.message, true);
        }
      });
    });
  }

  async function saveBlog(event) {
    event.preventDefault();
    const id = document.getElementById("blog-id").value;
    const formData = new FormData();
    formData.append("title", document.getElementById("blog-title").value.trim());
    formData.append("category", document.getElementById("blog-category").value.trim());
    formData.append("author", document.getElementById("blog-author").value.trim());
    formData.append("date_label", document.getElementById("blog-date").value.trim());
    formData.append("link", document.getElementById("blog-link").value.trim() || "news-details.html");
    formData.append("sort_order", document.getElementById("blog-sort").value || "0");
    const image = document.getElementById("blog-image").files[0];
    if (image) formData.append("image", image);

    try {
      if (id) {
        await apiRequest(`/api/blog/${id}`, { method: "PUT", body: formData });
        showMessage("blog-message", "تم تحديث المقال.");
      } else {
        if (!image) {
          showMessage("blog-message", "يرجى اختيار صورة.", true);
          return;
        }
        await apiRequest("/api/blog", { method: "POST", body: formData });
        showMessage("blog-message", "تمت إضافة المقال.");
      }
      resetBlogForm();
      await loadBlog();
    } catch (error) {
      showMessage("blog-message", error.message, true);
    }
  }

  /* ——— Settings ——— */
  async function loadSettings() {
    const settings = await apiRequest("/api/settings");
    document.getElementById("clients-label").value = settings.clients_label || "";
    document.getElementById("about-preview").style.backgroundImage =
      `url('${resolveImageUrl(settings.about_image)}')`;
    document.getElementById("contact-preview").style.backgroundImage =
      `url('${resolveImageUrl(settings.contact_image)}')`;
  }

  async function saveSettings(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append("clients_label", document.getElementById("clients-label").value.trim());

    const about = document.getElementById("about-image").files[0];
    const contact = document.getElementById("contact-image").files[0];
    if (about) formData.append("about_image", about);
    if (contact) formData.append("contact_image", contact);

    try {
      await apiRequest("/api/settings", { method: "PUT", body: formData });
      document.getElementById("about-image").value = "";
      document.getElementById("contact-image").value = "";
      await loadSettings();
      showMessage("settings-message", "تم حفظ الإعدادات.");
    } catch (error) {
      showMessage("settings-message", error.message, true);
    }
  }

  function initDashboard() {
    initTabs();

    document.getElementById("logout-btn").addEventListener("click", () => {
      clearToken();
      window.location.href = "login.html";
    });

    document.getElementById("project-form").addEventListener("submit", saveProject);
    document.getElementById("project-cancel").addEventListener("click", resetProjectForm);
    document.getElementById("client-form").addEventListener("submit", saveClient);
    document.getElementById("client-cancel").addEventListener("click", resetClientForm);
    document.getElementById("testimonial-form").addEventListener("submit", saveTestimonial);
    document.getElementById("testimonial-cancel").addEventListener("click", resetTestimonialForm);
    document.getElementById("blog-form").addEventListener("submit", saveBlog);
    document.getElementById("blog-cancel").addEventListener("click", resetBlogForm);
    document.getElementById("settings-form").addEventListener("submit", saveSettings);

    document.querySelectorAll("[data-refresh]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const map = {
          projects: loadProjects,
          clients: loadClients,
          testimonials: loadTestimonials,
          blog: loadBlog,
        };
        map[btn.dataset.refresh]?.();
      });
    });

    Promise.all([loadProjects(), loadClients(), loadTestimonials(), loadBlog(), loadSettings()]).catch(
      (error) => showMessage("project-message", error.message, true)
    );
  }

  return {
    login,
    guardLoginPage,
    guardDashboardPage,
    initDashboard,
  };
})();
