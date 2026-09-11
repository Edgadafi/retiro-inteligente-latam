import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const WIDGET = process.argv[2];

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://retirobtc.mx/",
  runScripts: "outside-only",
});
const { window } = dom;
window.fetch = () => Promise.reject(new Error("sin red"));
window.eval(readFileSync(WIDGET, "utf8"));

const results = [];
const check = (name, fn) => {
  try {
    const detail = fn();
    results.push(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (err) {
    results.push(`  FAIL  ${name} — ${err.message}`);
    process.exitCode = 1;
  }
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const toggle = window.document.getElementById("rito-toggle");
const panel = window.document.getElementById("rito-panel");

check("el boton visible dice Rita", () => {
  assert(toggle, "no se monto #rito-toggle");
  assert(toggle.textContent === "Rita", `dice "${toggle.textContent}"`);
  return `textContent="${toggle.textContent}"`;
});

check("la etiqueta accesible dice Rita", () => {
  const label = toggle.getAttribute("aria-label");
  assert(/Rita/.test(label), `aria-label="${label}"`);
  return `aria-label="${label}"`;
});

check("window.Rita expone open/close", () => {
  assert(window.Rita, "window.Rita no existe");
  assert(typeof window.Rita.open === "function", "open no es funcion");
  assert(typeof window.Rita.close === "function", "close no es funcion");
  return "open() y close() presentes";
});

check("window.Rito sigue existiendo como alias legacy", () => {
  assert(window.Rito, "window.Rito no existe: se rompen los embeds ya desplegados");
  assert(window.Rito === window.Rita, "window.Rito no apunta a window.Rita");
  return "window.Rito === window.Rita";
});

check("window.Rito.open() abre el panel de verdad", () => {
  assert(!panel.classList.contains("open"), "el panel ya estaba abierto");
  window.Rito.open();
  assert(panel.classList.contains("open"), "el panel no recibio la clase .open");
  assert(
    toggle.getAttribute("aria-expanded") === "true",
    `aria-expanded="${toggle.getAttribute("aria-expanded")}"`,
  );
  return ".open aplicada, aria-expanded=true";
});

check("el saludo se presenta como Rita", () => {
  const text = window.document.getElementById("rito-messages").textContent;
  assert(/Hola, soy Rita/.test(text), `saludo: "${text.slice(0, 60)}"`);
  return "«Hola, soy Rita…»";
});

check("window.Rito.close() cierra el panel", () => {
  window.Rito.close();
  assert(!panel.classList.contains("open"), "el panel siguio con la clase .open");
  assert(
    toggle.getAttribute("aria-expanded") === "false",
    `aria-expanded="${toggle.getAttribute("aria-expanded")}"`,
  );
  return ".open retirada, aria-expanded=false";
});

check("los identificadores desplegados siguen en el namespace rito", () => {
  for (const id of ["rito-root", "rito-toggle", "rito-panel", "rito-messages", "rito-input"]) {
    assert(window.document.getElementById(id), `falta #${id}`);
  }
  assert(window.localStorage.getItem("rito_session"), "falta la clave rito_session");
  return "ids #rito-* y localStorage rito_session intactos";
});

console.log(results.join("\n"));
