// Manda un mail simple a cada vendedor avisando que su premio del mes se
// actualizo, sin incluir cifras (el detalle sigue detras del PIN de la app).
// Se dispara solo cuando index.html cambia en un push a main (ver workflow).
"use strict";
const fs = require("fs");
const nodemailer = require("nodemailer");

const SITE_URL = "https://luanam-ui.github.io/premio-formagge/";

function requireEnv(name){
  const v = process.env[name];
  if (!v) { console.error("Falta la variable de entorno " + name); process.exit(1); }
  return v;
}

function loadBakedState(){
  const html = fs.readFileSync("index.html", "utf8");
  const m = html.match(/\/\*__BAKED_STATE__\*\/var BAKED_STATE = ([\s\S]*?);\/\*__END_BAKED_STATE__\*\//);
  if (!m) { console.error("No se encontro BAKED_STATE en index.html"); process.exit(1); }
  return JSON.parse(m[1]);
}

async function main(){
  const gmailUser = requireEnv("GMAIL_USER");
  const gmailPass = requireEnv("GMAIL_APP_PASSWORD");
  const emails = JSON.parse(requireEnv("VENDOR_EMAILS_JSON"));
  const STATE = loadBakedState();
  const period = STATE.period || "este mes";
  const names = Object.keys(STATE.targets || {});

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass }
  });

  let sent = 0, skipped = [];
  for (const name of names){
    const to = emails[name];
    if (!to){ skipped.push(name); continue; }
    const firstName = name.split(" ")[0];
    const subject = "Formagge · Tu premio de " + period + " ya está actualizado";
    const text =
      "Hola " + firstName + ",\n\n" +
      "Ya está actualizado tu avance de comisiones de " + period + ".\n\n" +
      "Entrá a " + SITE_URL + " y poné tu PIN de siempre para ver el detalle.\n\n" +
      "Saludos,\nControl de Gestión · Formagge";

    await transporter.sendMail({
      from: '"Formagge · Control de Gestión" <' + gmailUser + '>',
      to: to, subject: subject, text: text
    });
    console.log("Enviado a " + name + " -> " + to);
    sent++;
  }

  if (skipped.length) console.log("Sin email cargado (no se les mando nada): " + skipped.join(", "));
  console.log("Listo. " + sent + " de " + names.length + " vendedores avisados.");
}

main().catch(function(err){ console.error(err); process.exit(1); });
