import { chromium as playwrightChromium, Page } from "playwright-core";
import chromium from "@sparticuz/chromium-min";
import { geocode } from "@/services/geocode";

function extrairLocalizacao(endereco: string) {
  const texto = endereco.replace(/\s+/g, " ").trim();
  const partesPorHifen = texto.split(" - ").map((x) => x.trim());
  let bairro = "";
  let cidade = "";
  let estado = "";

  if (partesPorHifen.length >= 2) {
    const antesDoHifen = partesPorHifen[0].split(",").map((x) => x.trim()).filter(Boolean);
    bairro = antesDoHifen[0] ?? "";
    cidade = antesDoHifen[1] ?? "";
    estado = partesPorHifen[1].split(",").map((x) => x.trim())[0] ?? "";
  } else {
    const partes = texto.split(",").map((x) => x.trim()).filter(Boolean);
    bairro = partes[0] ?? "";
    cidade = partes[1] ?? "";
    estado = partes[2] ?? "";
  }

  return {
    bairro: bairro.replace(/^St\.\s*/i, "").replace(/^Setor\s*/i, "").trim(),
    cidade,
    estado,
  };
}

export async function abrirGoogleMaps() {
  const isProd = process.env.NODE_ENV === "production";

  const browser = await playwrightChromium.launch({
    args: isProd ? chromium.args : [],
    executablePath: isProd
      ? await chromium.executablePath("https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar")
      : undefined,
    headless: isProd ? true : false,
  });

  return { browser };
}

export async function pesquisarNicho(page: Page, nicho: string, local: string) {
  let lat = 0;
  let lng = 0;
  let endereco = "";

  try {
    const g = await geocode(local);
    lat = g.latitude;
    lng = g.longitude;
    endereco = g.endereco;
  } catch {
    const buscaInicial = encodeURIComponent(local);
    await page.goto(`https://www.google.com/maps/search/${buscaInicial}`, { waitUntil: "networkidle" });
    const urlFallback = page.url();
    const coordMatchFallback = urlFallback.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
    if (coordMatchFallback) {
      lat = parseFloat(coordMatchFallback[1]);
      lng = parseFloat(coordMatchFallback[2]);
    }
    try {
      endereco = (await page.locator(".Io6YTe").first().textContent()) ?? local;
    } catch {
      endereco = local;
    }
  }

  const localizacao = extrairLocalizacao(endereco);
  const bairro = local.trim() || localizacao.bairro || endereco.split(",")[0]?.trim() || "";
  const cidade = localizacao.cidade;
  const estado = localizacao.estado;
  const busca = `${nicho} ${bairro}`;

  try {
    await page.goto("https://www.google.com/maps", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1000);
  } catch {
  }

  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(busca)}`;
  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  }

  try {
    await page.waitForSelector('div[role="feed"]', { timeout: 30000 });
    await page.waitForSelector('a[href*="/place/"]', { timeout: 30000 });
  } catch {
  }

  return { lat, lng, bairro, cidade, estado };
}
