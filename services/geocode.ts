export interface GeocodeResult {
  latitude: number;
  longitude: number;
  endereco: string;
}

export async function geocode(
  local: string
): Promise<GeocodeResult> {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: local,
      format: "jsonv2",
      limit: "1",
      addressdetails: "1",
    });

  const resposta = await fetch(url, {
    headers: {
      "User-Agent": "MapsHunter/1.0",
    },
    cache: "no-store",
  });

  if (!resposta.ok) {
    throw new Error(
      "Erro ao consultar o Nominatim."
    );
  }

  const dados = await resposta.json();

  if (!Array.isArray(dados) || dados.length === 0) {
    throw new Error("Local não encontrado.");
  }

  return {
    latitude: Number(dados[0].lat),
    longitude: Number(dados[0].lon),
    endereco: dados[0].display_name,
  };
}