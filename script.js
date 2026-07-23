document.getElementById("year").textContent = new Date().getFullYear();

const header = document.querySelector(".site-header");
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

const earlyAccessForm = document.getElementById("earlyAccessForm");
const ctaTile = document.getElementById("ctaTile");
const ctaTileLabel = document.getElementById("ctaTileLabel");

earlyAccessForm.addEventListener("submit", () => {
  ctaTile.classList.remove("is-pending");
  ctaTile.classList.add("is-clear");
  ctaTileLabel.textContent = "Sent";
});
