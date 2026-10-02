import { describe, expect, it } from "vitest";
import { validarEdicaoPauta } from "./editar";

// 10/10/2026 12:00 em São Paulo = 15:00 UTC
const agora = new Date("2026-10-10T15:00:00Z");

describe("validarEdicaoPauta", () => {
  it("publicada não muda mais", () => {
    expect(
      validarEdicaoPauta(
        { statusAtual: "publicado", data: "2026-10-12", hora: "09:00" },
        agora,
      ),
    ).toMatch(/já foi publicada/);
  });

  it("não deixa escolher publicado nem falhou", () => {
    expect(
      validarEdicaoPauta(
        {
          statusAtual: "pronto",
          status: "publicado",
          data: "2026-10-12",
          hora: null,
        },
        agora,
      ),
    ).toMatch(/publicação automática/);
  });

  it("agendar sem hora recusa", () => {
    expect(
      validarEdicaoPauta(
        {
          statusAtual: "pronto",
          status: "agendado",
          data: "2026-10-12",
          hora: null,
        },
        agora,
      ),
    ).toMatch(/hora/);
  });

  it("agendar no passado recusa, no futuro passa", () => {
    expect(
      validarEdicaoPauta(
        {
          statusAtual: "pronto",
          status: "agendado",
          data: "2026-10-10",
          hora: "11:00",
        },
        agora,
      ),
    ).toMatch(/já passou/);
    expect(
      validarEdicaoPauta(
        {
          statusAtual: "pronto",
          status: "agendado",
          data: "2026-10-10",
          hora: "13:00",
        },
        agora,
      ),
    ).toBeNull();
  });

  it("quem já estava agendado e só mudou o formato não é revalidado", () => {
    expect(
      validarEdicaoPauta(
        {
          statusAtual: "agendado",
          data: "2026-10-01",
          hora: "09:00",
          dataAntes: "2026-10-01",
          horaAntes: "09:00",
        },
        agora,
      ),
    ).toBeNull();
  });

  it("quem já estava agendado e mexeu na data é revalidado", () => {
    expect(
      validarEdicaoPauta(
        {
          statusAtual: "agendado",
          data: "2026-10-02",
          hora: "09:00",
          dataAntes: "2026-10-01",
          horaAntes: "09:00",
        },
        agora,
      ),
    ).toMatch(/já passou/);
  });

  it("planejar no passado como ideia é livre", () => {
    expect(
      validarEdicaoPauta(
        {
          statusAtual: "ideia",
          status: "pronto",
          data: "2026-09-01",
          hora: null,
        },
        agora,
      ),
    ).toBeNull();
  });
});
