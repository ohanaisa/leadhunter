import { NextResponse } from "next/server";

const SERPAPI_BASE = "https://serpapi.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { local, nichos } = body as { local: string; nichos: string[] };

    if (!local?.trim() || !Array.isArray(nichos) || nichos.length === 0) {
      return NextResponse.json(
        { erro: "Informe um bairro e pelo menos um subnicho." },
        { status: 400 }
      );
    }

    // Cole a sua chave da SerpApi entre as aspas abaixo:
    const apiKey = "SUA_CHAVE_AQUI"; 

    const empresas: any[] = [];

    for (const nicho of nichos) {
      const query = `${nicho} ${local}`;
      const url = new URL(SERPAPI_BASE);
      url.searchParams.set("engine", "google_maps");
      url.searchParams.set("q", query);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("google_domain", "google.com.br");
      url.searchParams.set("hl", "pt-BR");
      url.searchParams.set("gl", "br");

      const resposta = await fetch(url.toString());
      if (!resposta.ok) {
        throw new Error(`Erro na SerpApi: ${resposta.status}`);
      }

      const data = await resposta.json();
      const results = data?.local_results || data?.map_results || [];
      
      for (const item of results) {
        empresas.push({
          nome: item.title || item.name || "Sem nome",
          href: item.link || item.place_link || "#",
          endereco: item.address || "Sem endereco",
          telefone: item.phone || "Sem telefone",
          site: item.website || "",
          avaliacao: item.rating?.toString() || "0",
        });
      }
    }

    return NextResponse.json({
      quantidade: empresas.length,
      empresas,
    });
  } catch (error) {
    return NextResponse.json(
      {
        erro: error instanceof Error ? error.message : "Erro interno no servidor.",
      },
      { status: 500 }
    );
  }
}
