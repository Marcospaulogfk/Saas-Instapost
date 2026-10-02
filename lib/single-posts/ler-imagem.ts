/**
 * Lê a foto escolhida (galeria ou câmera) e devolve uma data URL.
 *
 * Foto de celular passa fácil de 5MB e travava com "imagem muito grande". Aqui
 * a foto é reduzida (lado maior até 2000px) antes de entrar no post, então o
 * usuário não precisa saber de tamanho de arquivo. PNG com transparência
 * continua PNG; o resto vira JPEG. Se algo falhar, devolve a original.
 */
const LADO_MAXIMO = 2000;

export const LIMITE_BYTES = 12 * 1024 * 1024;

function lerComoDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () =>
      typeof r.result === "string"
        ? resolve(r.result)
        : reject(new Error("leitura"));
    r.onerror = () => reject(new Error("leitura"));
    r.readAsDataURL(file);
  });
}

export async function lerImagemReduzida(file: File): Promise<string> {
  const original = await lerComoDataUrl(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((ok, erro) => {
      img.onload = () => ok();
      img.onerror = () => erro(new Error("decode"));
      img.src = original;
    });
    const maior = Math.max(img.naturalWidth, img.naturalHeight);
    if (maior <= LADO_MAXIMO && file.size <= 5 * 1024 * 1024) return original;
    const escala = Math.min(1, LADO_MAXIMO / maior);
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, w, h);
    const png = file.type === "image/png";
    return canvas.toDataURL(png ? "image/png" : "image/jpeg", 0.88);
  } catch {
    return original;
  }
}

/**
 * Versão "arquivo" de lerImagemReduzida, pra quem manda a foto pro servidor
 * (upload do carrossel). Foto de câmera de celular chega a 8MB; o servidor
 * recusa acima de 10MB. Reduz só o que passa de 3MB ou de 2400px de lado.
 */
export async function reduzirArquivo(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((ok, erro) => {
      img.onload = () => ok();
      img.onerror = () => erro(new Error("decode"));
      img.src = url;
    });
    URL.revokeObjectURL(url);
    const maior = Math.max(img.naturalWidth, img.naturalHeight);
    if (maior <= 2400 && file.size <= 3 * 1024 * 1024) return file;
    const escala = Math.min(1, LADO_MAXIMO / maior);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = file.type === "image/png";
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, png ? "image/png" : "image/jpeg", 0.88),
    );
    if (!blob || blob.size >= file.size) return file;
    const nome = file.name.replace(/\.[^.]+$/, "") + (png ? ".png" : ".jpg");
    return new File([blob], nome, { type: blob.type });
  } catch {
    return file;
  }
}
