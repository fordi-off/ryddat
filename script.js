document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Header scroll state */
const header = document.getElementById("siteHeader");
const onScroll = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* Mobile nav */
const navToggle = document.getElementById("navToggle");
navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

/* Scroll reveal */
if (reduceMotion) {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

/* Count-up stats */
function animateCount(el) {
  const target = Number(el.dataset.countTo);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  if (reduceMotion || !target) return;
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + target + suffix;
  }
  requestAnimationFrame(tick);
}
const countEls = document.querySelectorAll("[data-count-to]");
if (countEls.length) {
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  countEls.forEach((el) => countObserver.observe(el));
}

/* Hero status demo: missing -> requested -> received, once.
   Text set here is re-applied on locale change (see the listener below),
   since these elements get overwritten by JS and can't stay wired to
   data-i18n once the animation has touched them. */
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const statCount = document.getElementById("statCount");
function i18nText(key, fallback) {
  const dict = window.RyddatI18n && window.RyddatI18n.currentDict();
  const val = dict && window.RyddatI18n.get(dict, key);
  return typeof val === "string" ? val : fallback;
}
let heroDemoStatusKey = "heroVisual.statusMissing";
let heroDemoOpenCount = 14;

function renderHeroDemoText() {
  if (statusText) statusText.textContent = i18nText(heroDemoStatusKey, statusText.textContent);
  if (statCount) {
    const openSuffix = i18nText("heroVisual.openSuffix", "open");
    statCount.textContent = heroDemoOpenCount + " " + openSuffix;
  }
}

if (statusBadge && !reduceMotion) {
  const sequence = [
    { delay: 1400, cls: "status-requested", statusKey: "heroVisual.statusRequested", icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
    { delay: 2600, cls: "status-received", statusKey: "heroVisual.statusReceived", icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  ];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        sequence.forEach((step) => {
          setTimeout(() => {
            statusBadge.classList.remove("status-missing", "status-requested", "status-received");
            statusBadge.classList.add(step.cls);
            heroDemoStatusKey = step.statusKey;
            if (step.cls === "status-received") heroDemoOpenCount = 13;
            const path = statusBadge.querySelector("path");
            if (path) path.setAttribute("d", step.icon);
            renderHeroDemoText();
          }, step.delay);
        });
      });
    },
    { threshold: 0.4 }
  );
  observer.observe(statusBadge);
}

/* Early access form feedback */
const earlyAccessForm = document.getElementById("earlyAccessForm");
const submitBtn = document.getElementById("submitBtn");
let submitIsLoading = false;
if (earlyAccessForm) {
  earlyAccessForm.addEventListener("submit", () => {
    const label = submitBtn.querySelector(".btn-label");
    submitIsLoading = true;
    if (label) label.textContent = i18nText("cta.submitLoading", "Opening email…");
    submitBtn.disabled = true;
    setTimeout(() => {
      submitIsLoading = false;
      if (label) label.textContent = i18nText("cta.submit", "Request access");
      submitBtn.disabled = false;
    }, 2500);
  });
}

/* Re-render every dynamically-set string when the language changes,
   since data-i18n only covers elements JS hasn't already overwritten. */
document.addEventListener("ryddat:locale-changed", () => {
  renderHeroDemoText();
  if (submitIsLoading && submitBtn) {
    const label = submitBtn.querySelector(".btn-label");
    if (label) label.textContent = i18nText("cta.submitLoading", "Opening email…");
  }
});
