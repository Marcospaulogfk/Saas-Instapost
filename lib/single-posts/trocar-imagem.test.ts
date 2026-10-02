import { describe, expect, it } from "vitest";
import { listarImagens, trocarImagem } from "./trocar-imagem";
import type { FreePostSpec } from "./free-spec";

const spec: FreePostSpec = {
  version: 1,
  background: { kind: "photo", photo_url: "https://x/fundo.png" },
  blocks: [
    {
      type: "text",
      text: "oi",
      font: "inter",
      font_size: "4cqw",
      color: "#fff",
      position: { top: 0, left: 0 },
    },
    { type: "image", url: "https://x/a.png", position: { top: 0, left: 0 } },
    {
      type: "card",
      bg: "#000",
      position: { top: 0, left: 0 },
      children: [
        {
          type: "image",
          url: "https://x/b.png",
          position: { top: 0, left: 0 },
        },
      ],
    },
  ],
};

describe("trocar-imagem", () => {
  it("lista fundo e imagens, inclusive dentro de card", () => {
    const l = listarImagens(spec);
    expect(l.map((i) => i.alvo)).toEqual(["fundo", "1", "2.0"]);
    expect(l.map((i) => i.rotulo)).toEqual([
      "Foto de fundo",
      "Imagem 1",
      "Imagem 2",
    ]);
  });

  it("troca o fundo sem tocar nos blocos", () => {
    const novo = trocarImagem(spec, "fundo", "data:image/png;base64,AAA");
    expect(novo.background.photo_url).toBe("data:image/png;base64,AAA");
    expect(novo.blocks).toBe(spec.blocks);
  });

  it("troca a imagem aninhada e deixa o original intacto", () => {
    const novo = trocarImagem(spec, "2.0", "https://x/nova.png");
    const card = novo.blocks[2] as { children: Array<{ url: string }> };
    expect(card.children[0].url).toBe("https://x/nova.png");
    expect(
      (spec.blocks[2] as { children: Array<{ url: string }> }).children[0].url,
    ).toBe("https://x/b.png");
  });

  it("ignora caminho que não é imagem", () => {
    const novo = trocarImagem(spec, "0", "https://x/z.png");
    expect(novo.blocks[0]).toBe(spec.blocks[0]);
  });
});
