# SyncPost — Fluxo de Cadastro de Marca

Especificação técnica para implementar o onboarding de marca do SyncPost, do entry point até a finalização da configuração.

---

## 1. Identidade visual

### Paleta de cores

```css
/* Cor da marca */
--purple:         #7C5CFF;  /* Primária — CTAs, links, indicadores positivos */
--purple-light:   #B8A4EA;  /* Texto sobre fundo roxo escuro */
--purple-dim:     rgba(124, 92, 255, 0.15);   /* Backgrounds sutis */
--purple-border:  rgba(124, 92, 255, 0.30);   /* Borders sutis */

/* Degradê do banner principal */
--gradient-banner: linear-gradient(135deg, #2A1A4F 0%, #1F1238 50%, #14081F 100%);

/* Fundos (escala de cinza) */
--bg-primary:     #0A0A0A;  /* Background principal */
--bg-surface:     #0F0F0F;  /* Header, footer, sidebar */
--bg-card:        #141414;  /* Cards, inputs */
--bg-elevated:    #181818;  /* Elementos sobre cards */

/* Borders */
--border-subtle:  #1F1F1F;  /* Default */
--border-default: #2A2A2A;  /* Hover, inputs */
--border-strong:  #3A3A3A;  /* Active */

/* Textos (hierarquia em cinzas) */
--text-primary:    #FFFFFF;
--text-secondary:  #A8A8A8;
--text-tertiary:   #6A6A6A;
--text-quaternary: #4A4A4A;

/* Estados */
--success: #4ADE80;
--error:   #EF4444;
```

### Tipografia

**Fonte:** `Google Sans Flex` (fallback: `Google Sans`, `Inter`, `system-ui`, `sans-serif`)

| Token       | Tamanho | Peso | Letter-spacing | Uso                                |
|-------------|---------|------|----------------|------------------------------------|
| `display`   | 26px    | 600  | -2.5%          | Título principal de tela           |
| `heading`   | 15-18px | 600  | -1.5%          | Títulos de seção                   |
| `body`      | 13-14px | 400  | 0              | Texto corrido                      |
| `metric`    | 26px    | 600  | -2.5%          | Números grandes                    |
| `label`     | 10-11px | 500  | +6% (UPPERCASE)| Labels acima de campos/métricas    |
| `ui`        | 13px    | 500  | -1%            | Botões, links                      |
| `caption`   | 11-12px | 400  | 0              | Helper text, descrições secundárias|

### Tokens de layout

```css
--radius-sm:  6px;   /* Inputs pequenos, pills */
--radius-md:  8px;   /* Botões, inputs */
--radius-lg:  12px;  /* Cards */
--radius-xl:  16px;  /* Containers grandes */
--radius-full: 999px;/* Pills, toggles, progress */

/* Espaçamento */
--space-xs:  4px;
--space-sm:  8px;
--space-md:  12px;
--space-lg:  16px;
--space-xl:  24px;
--space-2xl: 32px;
--space-3xl: 48px;
```

### Componentes base

- **Botão primário:** background `--purple`, texto branco, padding `10px 18px`, radius `--radius-md`
- **Botão ghost:** background transparente, texto `--text-secondary`, sem border
- **Botão outline:** background transparente, border `0.5px solid --border-default`
- **Input:** background `--bg-card`, border `0.5px solid --border-default`, focus com border `--purple` e ring `0 0 0 3px rgba(124,92,255,0.12)`
- **Card selecionável:** background `--bg-card`, border `0.5px`, no estado selecionado fica com border `--purple` e background `rgba(124,92,255,0.05)` + checkmark roxo no canto superior direito

---

## 2. Estrutura comum a todas as telas

### Header (fixo no topo)

- Logo SyncPost à esquerda (mark roxo 26×26 + nome em 15px/600)
- Subtítulo abaixo do nome: `Configure sua conta em 5 passos simples` (`--text-tertiary`, 11px)
- À direita: indicador `Passo X de 5` + botão de fechar (28×28, ícone X)
- Padding: `20px 32px`, borda inferior `0.5px solid --border-subtle`
- Background: `--bg-surface`

**Exceção:** a Tela 1 (entrada) e a Tela 2 (análise) não têm indicador de passo nem stepper.

### Stepper (passos 1 a 5)

Estrutura: barra de progresso fina (2px de altura, preenchimento roxo proporcional ao passo) + 5 círculos numerados abaixo, cada um com ícone temático e nome do passo.

**Estados do círculo:**
- **Pendente:** background `--bg-card`, border `--border-default`, ícone `--text-tertiary`
- **Ativo:** background `--purple`, border `--purple`, ícone branco, glow `0 0 0 4px rgba(124,92,255,0.12)`
- **Concluído:** background `--purple-dim`, border `--purple-border`, ícone de check `--purple-light`

**Mapa dos passos:**
1. Objetivo (ícone: alvo / círculos concêntricos)
2. Marca (ícone: prédio)
3. Público (ícone: grupo de pessoas)
4. Identidade (ícone: círculo com cruz)
5. Estilo (ícone: paleta / círculos coloridos)

### Footer (fixo no rodapé)

- Botão "Voltar" à esquerda (estilo ghost, com seta `←`)
- Botão "Continuar" à direita (estilo primário, com seta `→`)
- Padding: `20px 32px`, borda superior `0.5px solid --border-subtle`
- Background: `--bg-surface`

---

## 3. Telas do fluxo

### Tela 1 — Entrada do fluxo (`/onboarding`)

**Objetivo:** apresentar três caminhos de cadastro (automático via site, automático via Instagram, manual).

**Estrutura:**
- Header simples (sem stepper, sem indicador de passo, sem botão fechar)
- Subtítulo do header: `Configure sua conta rapidamente`
- Ícone circular roxo grande (56×56) com estrela/sparkle no centro
- Título: **"Vamos agilizar!"**
- Subtítulo: *Podemos preencher quase tudo automaticamente usando IA*

**Duas opções principais (lado a lado em desktop, empilhadas em mobile):**

1. **Tenho um Website**
   - Ícone: globo
   - Descrição: *Cole a URL e a IA analisa cores, tom de voz e mais*

2. **Tenho Instagram**
   - Ícone: instagram
   - Descrição: *Conecte sua conta Business para importar dados*

**Cada opção:**
- Background `--bg-card`, border `0.5px solid --border-default`, radius `--radius-lg`
- Padding `18px 20px`, flex com ícone (44×44) à esquerda + texto à direita
- No hover: border `--purple`, background `rgba(124,92,255,0.04)`

**Divisor "ou"** com linhas dos dois lados.

**Terceira opção (manual):**
- Border tracejada `--border-default`, background transparente
- Texto centralizado: `✎ Preencher manualmente`

---

### Tela 2 — Análise concluída pela IA (`/onboarding/analyze`)

**Objetivo:** mostrar que a IA analisou o site/Instagram do usuário, extraiu logo e cores, e identificou dados pra cada passo do onboarding.

**Estrutura:**
- Header simples (sem stepper)
- Toast no canto superior direito: "Análise concluída! Confira os dados e ajuste o que precisar." (background `--bg-card`, ícone de check verde em círculo)
- Ícone circular roxo com sparkle/estrela
- Título: **"Analisamos sua marca!"**
- Subtítulo: *Encontramos sua logo e extraímos as cores automaticamente*

**Badge de fonte (centralizado):**
- Pill com label `Fonte:` + URL clicável (ex: `amovacinas.com.br`) em roxo claro

**Card de logo detectada:**
- Background `rgba(74,222,128,0.05)`, border verde sutil, radius `--radius-lg`
- Preview da logo (60×60) à esquerda
- Texto central: *"Logo detectada!" + "As cores da marca foram extraídas automaticamente."*
- 3 círculos de cor à direita representando as cores extraídas (24×24, com border sutil)

**Lista de itens analisados (cards horizontais):**

Cada item:
- Background `--bg-card`, border `0.5px solid --border-subtle`, radius `--radius-md`, padding `14px 16px`
- Ícone 32×32 em background `--purple-dim` à esquerda
- Label do item ao centro
- À direita: ícone de check verde + ícone de lápis (editar) cinza

Itens:
1. **Dados Básicos** (ícone: alvo)
2. **Público-alvo** (ícone: pessoas)
3. **Estilo Visual** (ícone: nós/grafo)
4. **Tom de Voz** (ícone: balão de fala)

**Ações no final:**
- Botão primário full-width: `✓ Tudo certo! Continuar`
- Link em texto roxo claro abaixo: `✎ Quero ajustar manualmente`

---

### Tela 3 — Passo 1/5: Objetivo (`/onboarding/objetivo`)

**Objetivo:** usuário escolhe seu objetivo principal de marketing.

**Stepper:** passo 1 ativo, demais pendentes. Barra de progresso: 20%.

**Conteúdo:**
- Ícone circular roxo (alvo / círculos concêntricos)
- Título: **"Qual seu principal objetivo?"**
- Subtítulo: *Vamos começar entendendo sua meta principal*

**Grid 2×2 de cards selecionáveis:**

| Card                              | Ícone (cor)            | Descrição                       |
|-----------------------------------|------------------------|---------------------------------|
| Vender mais produtos/serviços     | gráfico subindo (verde)| Aumentar vendas e conversões    |
| Construir autoridade              | estrela (rosa)         | Se tornar referência no seu nicho|
| Aumentar engajamento              | coração (vermelho)     | Criar comunidade ativa          |
| Gerar leads qualificados          | pessoa + (roxo)        | Captar potenciais clientes      |

**Comportamento de cada card:**
- Apenas um pode estar selecionado por vez (single-select)
- Card selecionado: border `--purple`, background `rgba(124,92,255,0.05)`, checkmark roxo no canto superior direito
- Cada card tem um ícone temático colorido (40×40) com seu fundo tonalizado correspondente

**Footer:** botão Voltar (`← Voltar à Revisão`) + Continuar primário.

---

### Tela 4 — Passo 2/5: Marca (`/onboarding/marca`)

**Objetivo:** coletar informações básicas da marca.

**Stepper:** passo 1 concluído (check), passo 2 ativo. Barra: 40%.

**Conteúdo:**
- Ícone circular roxo (prédio)
- Título: **"Conte sobre sua marca"**
- Subtítulo: *Informações básicas para personalizarmos seu conteúdo*

**Campos:**

1. **Nome da Marca** (input text, single-line)
   - Placeholder: `Ex: Amo Vacinas`

2. **Onde esta marca atua?** (select com bandeira de país)
   - Componente: dropdown customizado com pill do código (ex: `BR`) + nome (`Brasil`)
   - Helper text abaixo: *"Usamos para mostrar as datas comemorativas certas do seu país"*

3. **O que a marca faz?** (textarea, 4 linhas)
   - Placeholder: `Descreva em poucas frases o negócio, produto ou serviço`
   - Helper text abaixo: *"Descreva em poucas frases o negócio, produto ou serviço"*

---

### Tela 5 — Passo 3/5: Público (`/onboarding/publico`)

**Objetivo:** coletar perfil do público-alvo, com campos avançados opcionais.

**Stepper:** passos 1 e 2 concluídos, passo 3 ativo. Barra: 60%.

**Conteúdo:**
- Ícone circular roxo (pessoas)
- Título: **"Quem é seu público-alvo?"**
- Subtítulo: *Descreva as pessoas que você quer alcançar*

**Campos principais:**

1. **Quem é o cliente ideal?** (textarea, 4 linhas, obrigatório)
   - Helper text acima: *"Idade, gênero, localização, profissão, estilo de vida"*

2. **Bloco "Configurações avançadas" (collapsible/accordion)**
   - Cabeçalho: ícone de lâmpada à esquerda + título "Configurações avançadas" + chevron à direita
   - Descrição: *"Esses detalhes ajudam a IA a criar conteúdo ainda melhor, mas você pode preencher depois."*
   - Quando expandido, mostra os campos opcionais abaixo

**Campos avançados (dentro do collapsible):**

3. **Quais são as dores e problemas desse público?** (textarea, opcional)
   - Helper text: *"O que incomoda? O que falta? Que problema precisam resolver?"*

4. **Quais são os desejos e sonhos?** (textarea, opcional)
   - Helper text: *"O que querem alcançar? Como querem se sentir?"*

---

### Tela 6 — Passo 5/5: Estilo visual (`/onboarding/estilo`)

**Objetivo:** definir identidade visual final (logo + cores da marca).

**Stepper:** passos 1-4 concluídos, passo 5 ativo. Barra: 100%.

**Conteúdo:**
- Ícone circular roxo (paleta de cores)
- Título: **"Estilo visual da marca"**
- Subtítulo: *Defina a identidade visual para suas criações*

**Seção 1 — Logo da marca (opcional):**

- Label: `🖼️ Logo da marca` com pill `opcional` ao lado
- **Quando logo já foi enviada:**
  - Box com border default, padding 20px
  - Preview da logo à esquerda (80×80) com badge verde de check no canto superior direito
  - À direita: *"✓ Logo enviada com sucesso"* (em verde) + nome do arquivo abaixo
  - Botão X para remover, no canto direito

- **Quando vazio (estado dropzone):**
  - Box com border tracejada
  - Ícone de upload + texto: *"Clique ou arraste sua logo aqui"*
  - Subtexto: *"PNG, JPG ou SVG até 5MB"*

**Seção 2 — Cores da marca:**

- Background `--bg-card`, border subtle, radius `--radius-lg`, padding 18px
- Header da seção:
  - À esquerda: ícone de paleta + título "Cores da marca"
  - À direita: toggle switch + label `Personalizar`
- Quando toggle desligado: mostra cores extraídas automaticamente (em readonly)
- Quando toggle ligado: mostra inputs de cor editáveis

**Lista de cores (3 chips):**
- Primária (chip 26×26 + label)
- Secundária (chip + label)
- Destaque (chip + label)

**Footer especial:** botão final é "Finalizar ✓" (ainda em roxo primário, mas com ícone de check em vez de seta).

---

## 4. Comportamentos e validações

### Navegação

- Setas `←` e `→` nos botões de footer mudam de passo
- Botão X no header abre modal de confirmação: *"Tem certeza? Suas alterações serão salvas como rascunho."* com opções `Sair` e `Continuar editando`
- Cada passo persiste em localStorage/state global para permitir voltar sem perder dados
- Ao voltar, campos preenchidos são restaurados

### Validações

- **Tela 3 (Objetivo):** ao menos 1 card precisa estar selecionado
- **Tela 4 (Marca):** Nome da Marca e País obrigatórios; descrição com mínimo 20 caracteres
- **Tela 5 (Público):** "Quem é o cliente ideal?" obrigatório; demais campos opcionais
- **Tela 6 (Estilo):** logo opcional; ao menos cor primária precisa estar definida

### Estados

- **Loading:** ao clicar em "Continuar", botão mostra spinner inline + texto "Salvando..."
- **Erro de validação:** field-label fica vermelho (`--error`), input com border vermelha, mensagem abaixo do campo
- **Sucesso:** transição suave entre passos com fade + slide-up de 200ms

### Análise via IA (Tela 2)

- Acessada vindo das opções "Website" ou "Instagram" da Tela 1
- Mostra estado de loading antes ("Analisando sua marca..." com ícone animado) por 2-4 segundos
- Após análise, mostra a Tela 2 com toast deslizando do topo

---

## 5. Stack sugerida (caso seja útil)

- **Framework:** React + TypeScript (ou Next.js se for o caso)
- **Estilização:** CSS variables nativas + módulos, ou Tailwind com config customizado pra usar os tokens acima
- **Fonte:** carregar Google Sans Flex via `@font-face` (você vai resolver licença) ou fallback Inter via Google Fonts
- **Ícones:** Lucide React (open source, mesma família visual dos ícones usados aqui)
- **Animações:** Framer Motion pra transições entre passos
- **Formulários:** React Hook Form + Zod pra validação
- **State:** Zustand ou Context API pra persistir progresso do onboarding entre telas

---

## 6. Acessibilidade

- Todos os inputs com `<label>` associado via `htmlFor`
- Cards selecionáveis devem ser navegáveis por teclado (`tabindex="0"`, `role="button"`, `aria-pressed`)
- Stepper deve usar `<nav aria-label="Progresso do cadastro">` com `aria-current="step"` no passo ativo
- Contraste de texto sobre fundos: garantir mínimo WCAG AA (4.5:1)
- Foco visível em todos os elementos interativos (já contemplado nos `:focus` definidos)

---

## 7. Responsividade

Breakpoints sugeridos:
- **Desktop (≥1024px):** layout como descrito acima
- **Tablet (768–1023px):** stepper mantém 5 colunas mas reduz nomes pra abreviações
- **Mobile (<768px):**
  - Stepper colapsa pra mostrar só "Passo X de 5" + barra
  - Cards de objetivo viram 1 coluna
  - Conteúdo full-width com padding lateral de 16px
  - Footer fica sticky no rodapé
