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

/* Hero document board: a small illustrative simulation that keeps running
   for as long as the page is open, not just once. Each row cycles through
   missing -> requested -> received on its own timer, then either renews
   (goes back to missing, as an expiring document would) or is swapped for
   a different document from the pool — so the board keeps feeling alive.
   Text set here is re-applied on locale change (see the listener below),
   since these elements get overwritten by JS and can't stay wired to
   data-i18n once the animation has touched them. */
const statCount = document.getElementById("statCount");
function i18nText(key, fallback) {
  const dict = window.RyddatI18n && window.RyddatI18n.currentDict();
  const val = dict && window.RyddatI18n.get(dict, key);
  return typeof val === "string" ? val : fallback;
}

let heroRenderAll = null;

const heroPool = [
  { initials: "AI", hue: 210, supplierKey: "heroVisual.supplier1", typeKey: "heroVisual.type1" },
  { initials: "NS", hue: 265, supplierKey: "heroVisual.supplier2", typeKey: "heroVisual.type2" },
  { initials: "KC", hue: 155, supplierKey: "heroVisual.supplier3", typeKey: "heroVisual.type3" },
  { initials: "BM", hue: 30, supplierKey: "heroVisual.supplier4", typeKey: "heroVisual.type4" },
  { initials: "FF", hue: 175, supplierKey: "heroVisual.supplier5", typeKey: "heroVisual.type5" },
  { initials: "NE", hue: 320, supplierKey: "heroVisual.supplier6", typeKey: "heroVisual.type6" },
  { initials: "TC", hue: 95, supplierKey: "heroVisual.supplier7", typeKey: "heroVisual.type7" },
];
const STATUS_META = {
  missing: { cls: "status-missing", key: "heroVisual.statusMissing", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" },
  requested: { cls: "status-requested", key: "heroVisual.statusRequested", icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  received: { cls: "status-received", key: "heroVisual.statusReceived", icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
};

const docRows = Array.from(document.querySelectorAll(".doc-row[data-slot]"));
if (docRows.length && !reduceMotion) {
  const initialStatuses = ["missing", "requested", "received", "received"];
  const usedPoolIndices = new Set(docRows.map((_, i) => i));
  const slots = docRows.map((row, i) => ({
    row,
    avatar: row.querySelector(".doc-avatar"),
    supplierEl: row.querySelector(".doc-supplier"),
    typeEl: row.querySelector(".doc-type"),
    badge: row.querySelector(".status-badge"),
    icon: row.querySelector(".status-badge path"),
    text: row.querySelector(".status-badge span"),
    poolIndex: i,
    status: initialStatuses[i] || "missing",
  }));
  let openCount = 14;

  function renderSlot(slot) {
    const entry = heroPool[slot.poolIndex];
    if (slot.avatar) {
      slot.avatar.textContent = entry.initials;
      slot.avatar.style.setProperty("--avatar-hue", entry.hue);
    }
    if (slot.supplierEl) slot.supplierEl.textContent = i18nText(entry.supplierKey, slot.supplierEl.textContent);
    if (slot.typeEl) slot.typeEl.textContent = i18nText(entry.typeKey, slot.typeEl.textContent);
    const meta = STATUS_META[slot.status];
    if (slot.badge) {
      slot.badge.classList.remove("status-missing", "status-requested", "status-received");
      slot.badge.classList.add(meta.cls);
    }
    if (slot.icon) slot.icon.setAttribute("d", meta.icon);
    if (slot.text) slot.text.textContent = i18nText(meta.key, slot.text.textContent);
  }

  function renderCount() {
    if (!statCount) return;
    statCount.textContent = openCount + " " + i18nText("heroVisual.openSuffix", "open");
  }

  heroRenderAll = function () {
    slots.forEach(renderSlot);
    renderCount();
  };

  function swapContent(slot) {
    const available = heroPool
      .map((_, idx) => idx)
      .filter((idx) => !usedPoolIndices.has(idx));
    if (!available.length) return false;
    usedPoolIndices.delete(slot.poolIndex);
    slot.poolIndex = available[Math.floor(Math.random() * available.length)];
    usedPoolIndices.add(slot.poolIndex);
    return true;
  }

  function applyUpdate(slot, swapped) {
    if (swapped) {
      slot.row.classList.add("doc-row-swapping");
      setTimeout(() => {
        renderSlot(slot);
        slot.row.classList.remove("doc-row-swapping");
      }, 200);
    } else {
      renderSlot(slot);
    }
  }

  function pulse(slot) {
    slot.row.classList.add("doc-row-pulse");
    setTimeout(() => slot.row.classList.remove("doc-row-pulse"), 900);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function scheduleNext(slot) {
    let delay;
    if (slot.status === "received") delay = rand(11000, 18000);
    else delay = rand(4000, 7000);

    setTimeout(() => {
      let swapped = false;
      if (slot.status === "missing") {
        slot.status = "requested";
      } else if (slot.status === "requested") {
        slot.status = "received";
        openCount = Math.max(10, openCount - 1);
      } else {
        swapped = Math.random() < 0.3 && swapContent(slot);
        slot.status = "missing";
        openCount = Math.min(18, openCount + 1);
      }
      renderCount();
      pulse(slot);
      applyUpdate(slot, swapped);
      scheduleNext(slot);
    }, delay);
  }

  heroRenderAll();
  slots.forEach((slot, i) => {
    setTimeout(() => scheduleNext(slot), i * 900 + Math.random() * 600);
  });
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
  if (heroRenderAll) heroRenderAll();
  if (submitIsLoading && submitBtn) {
    const label = submitBtn.querySelector(".btn-label");
    if (label) label.textContent = i18nText("cta.submitLoading", "Opening email…");
  }
});
