import { NextResponse } from "next/server";

const SERPAPI_BASE = "https://serpapi.com/search.json";

type Empresa = {
  nome: string;
  href: string;
  endereco?: string;
  telefone?: string;
  site?: string;
  avaliacao?: string;
};

export async function POST(request: Request) {
  const body = await request.json();

  const { browser } = await abrirGoogleMaps();

  const empresas = new Map<
    string,
    {
      nome: string;
      href: string;
    }
  >();

  try {
    for (const nicho of body.nichos as string[]) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

      try {
        const center = await pesquisarNicho(page, nicho, body.local);

        const resultado = await capturarEmpresas(page, center);

        for (const empresa of resultado) {
          empresas.set(empresa.href, empresa);
        }
      } finally {
        await page.close();
      }
    }

    return NextResponse.json({
      quantidade: empresas.size,
      empresas: Array.from(empresas.values()),
    });
  } catch (error) {
    return NextResponse.json(
      {
        erro: error instanceof Error ? `Erro ao realizar a pesquisa: ${error.message}` : "Erro ao realizar a pesquisa.",
      },
      { status: 500 }
    );
  } finally {
    try {
      await browser.close();
    } catch {
    }
  }
}