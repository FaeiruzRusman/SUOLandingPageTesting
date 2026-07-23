// ==================================================
// SUO APPLICATIONS HUB — STANDALONE SCRIPT
// No landing-page selectors are used in this file.
// ==================================================

"use strict";

const STORAGE_KEYS = {
  theme: "suoTheme",
  language: "suoLanguage"
};

const translations = {
  ms: {
    "apps.nav.home": "Laman Utama",
    "apps.nav.featured": "Pilihan",
    "apps.nav.directory": "Direktori",
    "apps.nav.coming": "Akan Datang",
    "apps.nav.back": "← Kembali",
    "apps.hero.eyebrow": "SUO Applications Hub",
    "apps.hero.title": "Terokai Ekosistem Digital<br />Perancangan Negeri Selangor.",
    "apps.hero.description": "Satu direktori bersepadu untuk dashboard, StoryMaps, aplikasi spatial dan sumber kecerdasan bandar yang dibangunkan oleh PLANMalaysia Selangor.",
    "apps.search.placeholder": "Cari aplikasi, dashboard atau StoryMaps...",
    "apps.filters.all": "Semua",
    "apps.filters.dashboard": "Dashboard",
    "apps.filters.storymaps": "StoryMaps",
    "apps.filters.coming": "Akan Datang",
    "apps.featured.badge": "Aplikasi Pilihan",
    "apps.featured.title": "Platform Utama SUO",
    "apps.featured.count": "4 Aplikasi Live",
    "apps.directory.badge": "Direktori Aplikasi",
    "apps.directory.title": "Dashboard dan StoryMaps",
    "apps.empty.title": "Tiada aplikasi ditemui.",
    "apps.empty.description": "Cuba gunakan kata kunci atau kategori yang berbeza.",
    "apps.cta.badge": "Platform Berkembang",
    "apps.cta.title": "Lebih Banyak Aplikasi Akan Ditambah Secara Berperingkat.",
    "apps.cta.description": "Direktori ini akan berkembang seiring pembangunan dashboard dan modul baharu SUO.",
    "apps.cta.button": "Lihat Pelan Hala Tuju",
    "apps.count.single": "aplikasi dipaparkan",
    "apps.count.plural": "aplikasi dipaparkan"
  },
  en: {
    "apps.nav.home": "Home",
    "apps.nav.featured": "Featured",
    "apps.nav.directory": "Directory",
    "apps.nav.coming": "Coming Soon",
    "apps.nav.back": "← Back",
    "apps.hero.eyebrow": "SUO Applications Hub",
    "apps.hero.title": "Explore Selangor's Digital<br />Planning Ecosystem.",
    "apps.hero.description": "An integrated directory for dashboards, StoryMaps, spatial applications and urban intelligence resources developed by PLANMalaysia Selangor.",
    "apps.search.placeholder": "Search applications, dashboards or StoryMaps...",
    "apps.filters.all": "All",
    "apps.filters.dashboard": "Dashboards",
    "apps.filters.storymaps": "StoryMaps",
    "apps.filters.coming": "Coming Soon",
    "apps.featured.badge": "Featured Application",
    "apps.featured.title": "SUO Flagship Platform",
    "apps.featured.count": "4 Live Applications",
    "apps.directory.badge": "Application Directory",
    "apps.directory.title": "Dashboards and StoryMaps",
    "apps.empty.title": "No applications found.",
    "apps.empty.description": "Try a different keyword or category.",
    "apps.cta.badge": "Growing Platform",
    "apps.cta.title": "More Applications Will Be Added Progressively.",
    "apps.cta.description": "This directory will continue to grow alongside new SUO dashboards and modules.",
    "apps.cta.button": "View Roadmap",
    "apps.count.single": "application displayed",
    "apps.count.plural": "applications displayed"
  }
};

const appSearch = document.getElementById("appSearch");
const filterButtons = [...document.querySelectorAll(".app-filter")];
const directoryItems = [...document.querySelectorAll("#appsDirectory .app-directory-item")];
const visibleAppCount = document.getElementById("visibleAppCount");
const noAppResults = document.getElementById("noAppResults");
const languageButton = document.getElementById("languageButton");
const languageMenu = document.getElementById("languageMenu");
const currentLanguageLabel = document.getElementById("currentLanguageLabel");
const languageOptions = [...document.querySelectorAll(".language-option")];
const themeToggle = document.getElementById("themeToggle");
const backToTop = document.getElementById("backToTop");

let activeFilter = "all";

function currentLanguage() {
  const stored = localStorage.getItem(STORAGE_KEYS.language)
    || localStorage.getItem("language")
    || document.documentElement.lang
    || "ms";
  return translations[stored] ? stored : "ms";
}

function updateCount(count) {
  if (!visibleAppCount) return;
  const language = currentLanguage();
  const dictionary = translations[language];
  const label = count === 1
    ? dictionary["apps.count.single"]
    : dictionary["apps.count.plural"];
  visibleAppCount.textContent = `${count} ${label}`;
}

function updateDirectory() {
  const query = (appSearch?.value || "").trim().toLowerCase();
  let visibleCount = 0;

  directoryItems.forEach((item) => {
    const category = item.dataset.category || "";
    const searchable = `${item.dataset.search || ""} ${item.textContent || ""}`.toLowerCase();
    const categoryMatches = activeFilter === "all" || category === activeFilter;
    const searchMatches = !query || searchable.includes(query);
    const visible = categoryMatches && searchMatches;

    item.classList.toggle("is-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  updateCount(visibleCount);

  if (noAppResults) {
    noAppResults.hidden = visibleCount !== 0;
  }
}

function applyLanguage(language) {
  const lang = translations[language] ? language : "ms";
  const dictionary = translations[lang];

  document.documentElement.lang = lang;
  localStorage.setItem(STORAGE_KEYS.language, lang);
  localStorage.setItem("language", lang);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = dictionary[element.dataset.i18n];
    if (value) element.textContent = value;
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const value = dictionary[element.dataset.i18nHtml];
    if (value) element.innerHTML = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const value = dictionary[element.dataset.i18nPlaceholder];
    if (value) element.placeholder = value;
  });

  if (currentLanguageLabel) {
    currentLanguageLabel.textContent = lang === "ms" ? "BM" : "EN";
  }

  languageOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.language === lang);
  });

  updateDirectory();
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark-mode", dark);
  localStorage.setItem(STORAGE_KEYS.theme, dark ? "dark" : "light");

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      dark ? "Aktifkan mod terang" : "Aktifkan mod gelap"
    );
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    updateDirectory();
  });
});

appSearch?.addEventListener("input", updateDirectory);

function closeLanguageMenu() {
  if (!languageMenu || !languageButton) return;
  languageMenu.classList.remove("open");
  languageButton.setAttribute("aria-expanded", "false");
}

languageButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = languageMenu?.classList.toggle("open") || false;
  languageButton.setAttribute("aria-expanded", String(isOpen));
});

languageOptions.forEach((option) => {
  option.addEventListener("click", () => {
    applyLanguage(option.dataset.language || "ms");
    closeLanguageMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".language-switcher")) {
    closeLanguageMenu();
  }
});

themeToggle?.addEventListener("click", () => {
  applyTheme(document.body.classList.contains("dark-mode") ? "light" : "dark");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && appSearch && document.activeElement !== appSearch) {
    event.preventDefault();
    appSearch.focus();
  }

  if (event.key === "Escape") {
    closeLanguageMenu();

    if (appSearch) {
      appSearch.value = "";
      appSearch.blur();
      updateDirectory();
    }
  }
});

window.addEventListener("scroll", () => {
  backToTop?.classList.toggle("visible", window.scrollY > 650);
}, { passive: true });

backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const savedTheme = localStorage.getItem(STORAGE_KEYS.theme)
  || localStorage.getItem("theme")
  || "light";

applyTheme(savedTheme === "dark" ? "dark" : "light");
applyLanguage(currentLanguage());
updateDirectory();
