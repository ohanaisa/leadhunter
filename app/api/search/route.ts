import { NextResponse } from "next/server";

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

    // Busca a chave das variáveis de ambiente na Vercel (ou fallback para string local se preferir)
    const apiKey = process.env.SERPAPI_KEY || "831240dd8c89b9b834a298ca54e99d6cfc5f2429750b1815960c5aa89fa7e7a0"; 

    if (!apiKey || apiKey === "831240dd8c89b9b834a298ca54e99d6cfc5f2429750b1815960c5aa89fa7e7a0") {
      return NextResponse.json(
        { erro: "Chave da SerpApi não configurada." },
        { status: 500 }
      );
    }

    const empresas: any[] = [];

    for (const nicho of nichos) {
      const query = encodeURIComponent(`${nicho} ${local}`);
      
      // Endereço correto da SerpApi para Google Maps
      const urlCompleta = `https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${apiKey}&google_domain=google.com.br&hl=pt-BR&gl=br`;

      const resposta = await fetch(urlCompleta, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const textoResposta = await resposta.text();

      if (!resposta.ok || textoResposta.trim().startsWith("<")) {
        return NextResponse.json(
          { erro: `A API externa recusou o acesso (Status ${resposta.status}). Resposta: ${textoResposta.substring(0, 150)}` },
          { status: 500 }
        );
      }

      const data = JSON.parse(textoResposta);
      const results = data?.local_results || data?.map_results || data?.places || [];
      
      for (const item of results) {
        empresas.push({
          nome: item.title || item.name || "Sem nome",
          href: item.link || item.place_link || "#",
          endereco: item.address || item.snippet || "Sem endereco",
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
        erro: error instanceof Error ? error.message : "Erro desconhecido no servidor da API.",
      },
      { status: 500 }
    );
  }
}