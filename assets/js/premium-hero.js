import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

const canvas = document.getElementById("canvas");

if (canvas) {
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

const toggle = document.querySelector(".glass-nav__toggle");
const mobileMenu = document.querySelector(".glass-nav-mobile");

if (toggle && mobileMenu) {
  toggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
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
  });
}
