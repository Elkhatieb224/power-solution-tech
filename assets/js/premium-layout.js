import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

const NAV_LINKS = [
  { id: "home", href: "index.html", label: "الرئيسية" },
  { id: "services", href: "services.html", label: "الخدمات" },
  { id: "projects", href: "projects.html", label: "مشاريعنا" },
  { id: "about", href: "about.html", label: "من نحن" },
  { id: "contact", href: "contact.html", label: "اتصل بنا" },
];

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <rect x="4" y="4" width="11" height="11" rx="2" fill="#8b5cf6"/>
  <rect x="17" y="4" width="11" height="11" rx="2" fill="#7c3aed" opacity="0.85"/>
  <rect x="4" y="17" width="11" height="11" rx="2" fill="#3b82f6" opacity="0.9"/>
  <rect x="17" y="17" width="11" height="11" rx="2" fill="#6366f1"/>
</svg>`;

function renderNav(activePage) {
  const links = NAV_LINKS.map(
    (link) =>
      `<li><a href="${link.href}" class="${link.id === activePage ? "is-active" : ""}">${link.label}</a></li>`
  ).join("");

  const mobileLinks = NAV_LINKS.map(
    (link) => `<li><a href="${link.href}">${link.label}</a></li>`
  ).join("");

  return `
    <div class="glass-nav-wrap">
      <nav class="glass-nav" aria-label="القائمة الرئيسية">
        <a href="index.html" class="glass-nav__logo">
          ${LOGO_SVG}
          <span>Power Solution Tech</span>
        </a>
        <ul class="glass-nav__links">${links}</ul>
        <div class="glass-nav__actions">
          <a href="contact.html" class="pst-btn-primary">ابدأ مشروعك</a>
          <button type="button" class="glass-nav__toggle" aria-label="فتح القائمة" aria-expanded="false" aria-controls="glass-nav-mobile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16"/>
            </svg>
          </button>
        </div>
      </nav>
      <div class="glass-nav-mobile" id="glass-nav-mobile">
        <ul>${mobileLinks}</ul>
        <div class="glass-nav-mobile__actions">
          <a href="contact.html" class="pst-btn-primary">ابدأ مشروعك</a>
        </div>
      </div>
    </div>`;
}

function renderFooter() {
  return `
    <footer class="premium-footer">
      <div class="premium-footer__inner">
        <div class="premium-footer__top">
          <div class="premium-footer__brand">
            <a href="index.html" class="glass-nav__logo">
              ${LOGO_SVG}
              <span>Power Solution Tech</span>
            </a>
            <p>شركة برمجيات متخصصة في تطوير الويب والأنظمة والتطبيقات بجودة عالية ومعايير احترافية.</p>
          </div>
          <div class="premium-footer__col">
            <h4>روابط سريعة</h4>
            <ul>
              <li><a href="index.html">الرئيسية</a></li>
              <li><a href="services.html">الخدمات</a></li>
              <li><a href="projects.html">مشاريعنا</a></li>
              <li><a href="about.html">من نحن</a></li>
              <li><a href="contact.html">اتصل بنا</a></li>
            </ul>
          </div>
          <div class="premium-footer__col">
            <h4>خدماتنا</h4>
            <ul>
              <li><a href="services.html#web">تطوير الويب</a></li>
              <li><a href="services.html#systems">الأنظمة</a></li>
              <li><a href="services.html#apps">التطبيقات</a></li>
            </ul>
          </div>
          <div class="premium-footer__col">
            <h4>تواصل</h4>
            <ul>
              <li><a href="mailto:info@powersolution.tech">info@powersolution.tech</a></li>
              <li><a href="tel:+966500000000">+966 50 000 0000</a></li>
            </ul>
          </div>
        </div>
        <div class="premium-footer__bottom">
          <p>&copy; ${new Date().getFullYear()} Power Solution Tech. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>`;
}

function initMobileMenu() {
  const toggle = document.querySelector(".glass-nav__toggle");
  const mobileMenu = document.querySelector(".glass-nav-mobile");

  if (!toggle || !mobileMenu) {
    return;
  }

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const isOpen = mobileMenu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle.setAttribute("aria-label", isOpen ? "إغلاق القائمة" : "فتح القائمة");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "فتح القائمة");
    });
  });

  document.addEventListener("click", (event) => {
    if (
      !mobileMenu.classList.contains("open") ||
      mobileMenu.contains(event.target) ||
      toggle.contains(event.target)
    ) {
      return;
    }

    mobileMenu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "فتح القائمة");
  });
}

function initCanvas() {
  const canvas = document.getElementById("canvas");

  if (!canvas) {
    return;
  }

  TubesCursor(canvas, {
    tubes: {
      colors: ["#ff008a", "#8b5cf6", "#3b82f6"],
      lights: {
        intensity: 50,
        colors: ["#ff008a", "#8b5cf6", "#3b82f6", "#ffffff"],
      },
    },
  });
}

const navRoot = document.getElementById("site-nav");
const footerRoot = document.getElementById("site-footer");
const activePage = document.body.dataset.page || "";

if (navRoot) {
  navRoot.innerHTML = renderNav(activePage);
}

if (footerRoot) {
  footerRoot.innerHTML = renderFooter();
}

initMobileMenu();
initCanvas();
