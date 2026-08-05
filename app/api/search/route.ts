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

    // INSIRA SUA CHAVE DA SERPAPI AQUI DENTRO DAS ASPAS:
    const apiKey = "a"; 

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

      const resposta = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      // Lendo como texto primeiro para evitar o erro de JSON inválido se a SerpApi falhar
      const textoResposta = await resposta.text();

      if (!resposta.ok || textoResposta.trim().startsWith("<")) {
        return NextResponse.json(
          { erro: `A API externa retornou uma mensagem inválida ou erro HTML. Verifique se a sua chave secreta da SerpApi está totalmente correta e ativa.` },
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
