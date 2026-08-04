import { Page } from "playwright";

type SearchCenter = {
  lat: number;
  lng: number;
  bairro: string;
  cidade: string;
  estado: string;
};

type EmpresaDetalhada = {
  nome: string;
  href: string;
  lat: number | null;
  lng: number | null;
  endereco?: string;
  telefone?: string;
  site?: string;
  horario?: string;
  instagram?: string;
  avaliacao?: string;
  cardapio?: string;
  missing?: string[];
};

function normalizeText(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function matchesSearchArea(
  endereco: string | undefined,
  hrefLat: number | null,
  hrefLng: number | null,
  center?: SearchCenter
) {
  if (!center) return true;

  const normalizedAddress = endereco ? normalizeText(endereco) : "";
  const normalizedBairro = normalizeText(center.bairro);

  if (normalizedBairro && normalizedAddress) {
    const safeBairro = normalizedBairro.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const bairroRegex = new RegExp(`\\b${safeBairro}\\b`, "i");
    if (bairroRegex.test(normalizedAddress) || normalizedAddress.includes(normalizedBairro)) {
      return true;
    }
  }

  if (hrefLat !== null && hrefLng !== null) {
    const dist = distanceMeters(center.lat, center.lng, hrefLat, hrefLng);
    return dist <= 2000;
  }

  return false;
}

async function extrairDetalhesEmpresa(page: Page, href: string) {
  try {
    await page.goto(href, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
  } catch {
  }

  return page.evaluate(() => {
    function firstText(selectors: string[]) {
      for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
      return undefined;
    }

    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
    const textElements = Array.from(document.querySelectorAll<HTMLElement>("button, span, div, a"));
    const textNodes = textElements.map((el) => el.textContent?.trim() ?? "");

    const endereco = firstText([
      'button[data-item-id="address"]',
      'button[aria-label*="Endereco"]',
      'button[aria-label*="Address"]',
      'div[data-item-id="address"]',
      'span[data-item-id="address"]',
      '[data-item-id="address"]',
    ]);

    const telefoneAnchor = anchors.find((a) => a.href.startsWith("tel:"));
    const telefoneButton = firstText([
      'button[aria-label*="Telefone"]',
      'button[aria-label*="Phone"]',
      'button[aria-label*="Ligar"]',
    ]);

    const telefone = telefoneAnchor?.href.replace(/^tel:/, "") || telefoneButton;

    const avaliacao = textNodes.find((text) =>
      /\d+(?:[\.,]\d+)?\s*(?:estrelas|estrela|stars|star)/i.test(text)
    );

    const siteLink = anchors.find(
      (a) =>
        /^https?:\/\//i.test(a.href) &&
        !/google\.com/i.test(a.href) &&
        !/maps\.google\.com/i.test(a.href) &&
        !/instagram\.com/i.test(a.href)
    );

    const instagramLink = anchors.find((a) => /instagram\.com/i.test(a.href));

    const cardapioLink = anchors.find(
      (a) =>
        /cardapio/i.test(a.textContent || "") ||
        /menu/i.test(a.textContent || "") ||
        /livemenu/i.test(a.href)
    );

    let cardapio = cardapioLink?.href;
    if (!cardapio) {
      const cardapioElement = Array.from(document.querySelectorAll<HTMLElement>("button, span, div, a")).find(
        (el) =>
          /cardapio|menu/i.test(el.textContent || "") ||
          /cardapio|menu/i.test(el.getAttribute("aria-label") || "")
      );
      if (cardapioElement) {
        const nestedLink = cardapioElement.querySelector<HTMLAnchorElement>("a[href]");
        cardapio = nestedLink?.href || cardapioElement.getAttribute("href") || cardapioElement.textContent?.trim();
        if (!cardapio && cardapioElement.parentElement) {
          const siblingLink = Array.from(cardapioElement.parentElement.querySelectorAll<HTMLAnchorElement>("a[href]")).find(
            (a) => /cardapio|menu|livemenu/i.test(a.href) || /cardapio|menu/i.test(a.textContent || "")
          );
          cardapio = siblingLink?.href || cardapio;
        }
      }
    }

    if (!cardapio) {
      const menuTextNode = textNodes.find((text) => /cardapio|menu/i.test(text));
      cardapio = menuTextNode;
    }

    const horarioText = textNodes.find((text) =>
      /^(?:Hoje|Segunda|Terca|Quarta|Quinta|Sexta|Sabado|Domingo|Aberto|Fechado|Horario)/i.test(text)
    );

    return {
      endereco,
      telefone,
      site: siteLink?.href,
      horario: horarioText,
      instagram: instagramLink?.href,
      avaliacao,
      cardapio,
    };
  });
}

export async function capturarEmpresas(page: Page, center?: SearchCenter) {
  try {
    const feed = page.locator('div[role="feed"]').first();
    try {
      await feed.waitFor({ timeout: 15000 });
    } catch {
    }

    let previousCount = -1;
    let stableCount = 0;
    let attempts = 0;
    while (stableCount < 3 && attempts < 15) {
      const currentCount = await page.locator('a[href*="/place/"]').count();
      if (currentCount === previousCount) {
        stableCount++;
      } else {
        stableCount = 0;
        previousCount = currentCount;
      }

      try {
        const feedExists = await page.$('div[role="feed"]');
        if (!feedExists) break;
        await feed.evaluate((el) => (el as HTMLElement).scrollBy(0, 2500));
      } catch {
        break;
      }

      await page.waitForTimeout(1200);
      attempts++;
    }

    const empresas = await page.evaluate(() => {
      const map = new Map<string, { nome: string; href: string; lat: number | null; lng: number | null }>();
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/place/"]'));
      for (const link of links) {
        const nome = link.getAttribute("aria-label") ?? "";
        if (!nome) continue;
        const href = link.href;
        let lat: number | null = null;
        let lng: number | null = null;
        const matchAt = href.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
        if (matchAt) {
          lat = parseFloat(matchAt[1]);
          lng = parseFloat(matchAt[2]);
        } else {
          const match3d = href.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
          if (match3d) {
            lat = parseFloat(match3d[1]);
            lng = parseFloat(match3d[2]);
          }
        }
        map.set(href, { nome, href, lat, lng });
      }
      return Array.from(map.values());
    });

    const empresasDetalhadas: EmpresaDetalhada[] = [];
    for (const empresa of empresas.slice(0, 20)) {
      const detalhes = await extrairDetalhesEmpresa(page, empresa.href);
      const merged: EmpresaDetalhada = { ...empresa, ...detalhes };
      if (!matchesSearchArea(merged.endereco, merged.lat, merged.lng, center)) continue;
      const missing: string[] = [];
      if (!merged.endereco) missing.push("endereco");
      if (!merged.telefone) missing.push("telefone");
      if (!merged.site) missing.push("site");
      if (!merged.horario) missing.push("horario");
      if (!merged.instagram) missing.push("instagram");
      if (!merged.avaliacao) missing.push("avaliacao");
      if (!merged.cardapio) missing.push("cardapio");
      merged.missing = missing;
      empresasDetalhadas.push(merged);
    }

    return empresasDetalhadas;
  } catch {
    return [];
  }
}
