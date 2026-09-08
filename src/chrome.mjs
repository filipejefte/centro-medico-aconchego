/* =========================================================================
   Casca compartilhada por todas as páginas: <head>, cabeçalho, rodapé e as
   peças de interface que aparecem em mais de um lugar.

   Duas regras que valem para tudo neste arquivo:

   1. NADA INLINE. A CSP do site é `default-src 'none'` e não abre exceção
      para estilo ou script embutido. Toda regra visual vive em
      assets/css/site.css e todo comportamento em assets/js/site.js.

   2. NADA DE TRAVESSÃO na copy. O verificador recusa a build se encontrar
      travessão ou meia-risca. Separe as frases com ponto ou vírgula.
   ========================================================================= */

import { CLINICA, MENU, UNIDADES, CANAIS } from './dados.mjs';

/* ------------------------------------------------------------------ */
/* Escapes                                                             */
/* ------------------------------------------------------------------ */

export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* ------------------------------------------------------------------ */
/* Contexto de build                                                   */
/* ------------------------------------------------------------------ */

/**
 * Monta o contexto que todas as páginas recebem.
 *
 * `ctx.dado(valor, rotulo)` é o coração do controle de qualidade: devolve o
 * valor quando ele existe e, quando é `null`, registra a pendência e devolve
 * uma marcação visível. A build de produção lê `ctx.pendencias` e se recusa a
 * gerar se a lista não estiver vazia.
 */
export function contexto({ preview }) {
  const pendencias = [];
  const ctx = {
    preview,
    origem: CLINICA.origem,
    pendencias,
    dado(valor, rotulo) {
      if (valor !== null && valor !== undefined && valor !== '') { return esc(valor); }
      pendencias.push(rotulo);
      return `<span class="pendente" title="Dado a confirmar com a clínica">${esc(rotulo)}: a confirmar</span>`;
    },
    /* Igual ao anterior, mas devolve texto puro para atributos e metadados. */
    dadoTexto(valor, alternativa, rotulo) {
      if (valor !== null && valor !== undefined && valor !== '') { return valor; }
      pendencias.push(rotulo);
      return alternativa;
    }
  };
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Ícones. Traçado próprio, sem biblioteca externa.                    */
/* ------------------------------------------------------------------ */

const svg = (corpo, extra = '') =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${corpo}</svg>`;

export const ICO = {
  telefone: svg('<path d="M6.5 3.5h3l1.5 4-2 1.4a12.5 12.5 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/>'),
  /* Traçado do glifo do WhatsApp, preenchido em vez de contornado. */
  whatsapp: `<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2A9.9 9.9 0 0 0 2.1 11.9a9.8 9.8 0 0 0 1.35 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01a9.9 9.9 0 0 0 9.93-9.9A9.9 9.9 0 0 0 12.04 2Zm0 18.09h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 1 1 6.98 3.87Zm4.5-6.14c-.24-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12s-.63.8-.77.96c-.14.17-.28.19-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.17.04-.31-.02-.43s-.55-1.34-.76-1.83c-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.75 2.75 0 0 0-.86 2.05c0 1.2.88 2.37 1 2.53.12.17 1.72 2.63 4.18 3.69 1.55.67 2.16.73 2.94.61.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.29Z"/></svg>`,
  local: svg('<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'),
  relogio: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.3V12l3.1 1.9"/>'),
  calendario: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M8 2.8v4.4M16 2.8v4.4M3.5 10.4h17"/>'),
  seta: svg('<path d="M5 12h13m-5.5-5.5L18.5 12l-6 5.5"/>'),
  check: svg('<path d="M4.5 12.6 9.5 17.5 19.5 6.5"/>'),
  documento: svg('<path d="M6 2.8h7l5 5v13.4H6Z"/><path d="M13 2.8v5.2h5"/><path d="M9 13h6M9 16.5h4"/>'),
  estetoscopio: svg('<path d="M6.5 3v5a4 4 0 0 0 8 0V3"/><path d="M5 3h3M13 3h3"/><path d="M10.5 12v2.5a4.5 4.5 0 0 0 9 0V13"/><circle cx="19.5" cy="11.2" r="1.9"/>'),
  imagem: svg('<rect x="3" y="4" width="18" height="16" rx="2.4"/><path d="M3 15.5l4.6-4.2a2 2 0 0 1 2.7 0L15 15.7"/><path d="M14.2 12.9l1.6-1.4a2 2 0 0 1 2.7 0L21 14"/><circle cx="9" cy="8.8" r="1.4"/>'),
  olho: svg('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>'),
  cama: svg('<path d="M3 19V7M3 12h11.5a4 4 0 0 1 4 4v3M3 19h18"/><circle cx="7.8" cy="9.6" r="1.9"/>'),
  coracao: svg('<path d="M12 20s-7.4-4.6-7.4-9.6a4.2 4.2 0 0 1 7.4-2.7 4.2 4.2 0 0 1 7.4 2.7c0 5-7.4 9.6-7.4 9.6Z"/>'),
  /* Alerta de verdade, para os avisos de emergência. Um coração ali leria
     como "cuidado" no sentido carinhoso, que é o oposto do necessário. */
  alerta: svg('<path d="M12 3.7 21.2 19.4H2.8Z"/><path d="M12 10v4"/><circle cx="12" cy="16.9" r=".9" fill="currentColor" stroke="none"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  fechar: svg('<path d="M6 6l12 12M18 6 6 18"/>')
};

/* ------------------------------------------------------------------ */
/* Logotipo                                                            */
/* ------------------------------------------------------------------ */

/* Arte oficial da própria clínica, extraída da imagem publicada por ela e
   recortada com canal alfa. Não é recriação: é o arquivo original, com o
   fundo azul removido. Proporção 982 por 208. */
export const logo = ({ base = '', variante = 'azul', classe = 'logo' } = {}) =>
  `<img class="${classe}" src="${base}assets/img/logo-aconchego-${variante}.png" width="982" height="208" alt="${esc(CLINICA.nome)}" decoding="async">`;

/* ------------------------------------------------------------------ */
/* Botões                                                              */
/* ------------------------------------------------------------------ */

export const botao = ({ href, texto, tipo = 'principal', icone = '', externo = false, extra = '' }) =>
  `<a class="btn btn-${tipo}" href="${esc(href)}"${externo ? ' target="_blank" rel="noopener noreferrer"' : ''}${extra}>${icone}<span>${esc(texto)}</span></a>`;

/* ------------------------------------------------------------------ */
/* Cabeçalho                                                           */
/* ------------------------------------------------------------------ */

function cabecalho(p, ctx) {
  const b = p.base;
  const itens = MENU.map(m => {
    const atual = m.path === p.path;
    return `<li><a href="${b}${m.path}"${atual ? ' aria-current="page"' : ''}>${esc(m.rotulo)}</a></li>`;
  }).join('');

  return `
<a class="pular" href="#conteudo">Ir direto ao conteúdo</a>
${ctx.preview ? faixaPrevia() : ''}
<div class="tarja">
  <p>Mantido pelo ${esc(CLINICA.mantenedor)}, instituição sem fins lucrativos de ${esc(CLINICA.cidade)} desde ${CLINICA.mantenedorDesde}.</p>
</div>
<header class="topo">
  <div class="env topo-linha">
    <a class="topo-marca" href="${b}index.html" aria-label="${esc(CLINICA.nome)}, ir para a página inicial">${logo({ base: b, variante: 'azul' })}</a>
    <button class="topo-botao" type="button" id="abrir-menu" aria-expanded="false" aria-controls="navegacao">
      ${ICO.menu}<span>Menu</span>
    </button>
    <nav class="topo-nav" id="navegacao" aria-label="Navegação principal">
      <ul>${itens}</ul>
    </nav>
    <div class="topo-acao">
      ${botao({ href: `${b}agendamento.html`, texto: 'Agendar', tipo: 'principal', icone: ICO.calendario })}
    </div>
  </div>
</header>`;
}

function faixaPrevia() {
  return `
<div class="previa">
  <p><strong>Prévia de apresentação.</strong> Esta página é uma proposta de site preparada para a diretoria do ${esc(CLINICA.nome)}. Ainda não é o site oficial da clínica e não está no ar para o público. Os dados marcados como "a confirmar" precisam ser conferidos pela instituição antes de qualquer publicação.</p>
</div>`;
}

/* ------------------------------------------------------------------ */
/* Rodapé                                                              */
/* ------------------------------------------------------------------ */

function rodape(p, ctx) {
  const b = p.base;

  const unidades = UNIDADES.map(u => `
    <div class="rp-unidade">
      <h3>${esc(u.nome)}</h3>
      <p class="rp-end">${esc(u.logradouro)}, <b>${esc(u.numero)}</b><br>${esc(u.bairro)}, ${esc(u.cidade)} ${esc(u.uf)}<br>CEP ${esc(u.cep)}</p>
      <a class="rp-mapa" href="${esc(u.mapa)}" target="_blank" rel="noopener noreferrer">${ICO.local}<span>Ver no mapa</span></a>
    </div>`).join('');

  const canais = CANAIS.map(c => `
    <li>
      <span class="rp-canal">${esc(c.titulo)}</span>
      <a href="tel:+${esc(c.e164)}">${esc(c.telefone)}</a>
    </li>`).join('');

  return `
<footer class="rodape">
  <div class="env">
    <div class="rp-grade">
      <div class="rp-marca">
        ${logo({ base: b, variante: 'branco', classe: 'logo logo-rodape' })}
        <p>${esc(CLINICA.assinatura)} em ${esc(CLINICA.cidade)}, ${esc(CLINICA.uf)}.</p>
        <p class="rp-mant">Mantido pelo ${esc(CLINICA.mantenedor)}.</p>
      </div>
      <div class="rp-col">
        <h3>Telefones</h3>
        <ul class="rp-lista">${canais}</ul>
        <p class="rp-zap">
          <a href="${esc(CANAIS[0].whatsappLink)}" target="_blank" rel="noopener noreferrer">${ICO.whatsapp}<span>WhatsApp ${esc(CANAIS[0].whatsapp)}</span></a>
        </p>
      </div>
      <div class="rp-col rp-unidades">${unidades}</div>
      <div class="rp-col">
        <h3>Navegar</h3>
        <ul class="rp-lista rp-links">
          ${MENU.map(m => `<li><a href="${b}${m.path}">${esc(m.rotulo)}</a></li>`).join('')}
          <li><a href="${b}agendamento.html">Agendar</a></li>
          <li><a href="${b}contato.html">Contato</a></li>
          <li><a href="${b}privacidade.html">Privacidade</a></li>
        </ul>
      </div>
    </div>

    <div class="rp-legal">
      <p class="rp-ident">
        ${esc(CLINICA.razaoSocial)}. CNPJ ${esc(CLINICA.cnpj)}. ${esc(CLINICA.naturezaJuridica)}.
        Diretor técnico: ${ctx.dado(CLINICA.diretorTecnico, 'Diretor técnico')} ${ctx.dado(CLINICA.crmDiretorTecnico, 'CRM-SP do diretor técnico')}.
      </p>
      <p class="rp-aviso">
        As informações deste site têm caráter informativo e não substituem a consulta médica.
        Diagnóstico e tratamento dependem de avaliação presencial por profissional habilitado.
      </p>
      <p class="rp-fim">Conteúdo publicado sob responsabilidade do ${esc(CLINICA.mantenedor)}.</p>
    </div>
  </div>
</footer>`;
}

/* ------------------------------------------------------------------ */
/* Casca completa                                                      */
/* ------------------------------------------------------------------ */

/* Uma CSP fechada. `default-src 'none'` derruba tudo que não estiver aberto
   abaixo, e nada aqui abre para terceiro: sem CDN, sem fonte remota, sem
   analytics, sem iframe. `form-action 'none'` porque nenhum formulário do
   site envia dados para lugar nenhum. */
const CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "img-src 'self'",
  "style-src 'self'",
  "script-src 'self'",
  "font-src 'self'",
  "connect-src 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests'
].join('; ');

export function shell({ p, ctx, body, ld }) {
  const b = p.base;
  const url = `${ctx.origem}/${p.path === 'index.html' ? '' : p.path}`;
  const titulo = p.path === 'index.html'
    ? `${CLINICA.nome}, ${CLINICA.assinatura} em ${CLINICA.cidade} SP`
    : `${p.titulo} | ${CLINICA.nome}`;

  const jsonld = ld ? `<script type="application/ld+json">${JSON.stringify(ld, null, 0).replace(/</g, '\\u003c')}</script>` : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="light">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(p.descricao)}">
<meta name="robots" content="${ctx.preview ? 'noindex, nofollow' : 'index, follow'}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(CLINICA.nome)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(p.descricao)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ctx.origem)}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(CLINICA.nome)}, ${esc(CLINICA.assinatura)} em ${esc(CLINICA.cidade)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#316F98">
<link rel="icon" type="image/png" sizes="32x32" href="${b}assets/img/icone-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="${b}assets/img/icone-192.png">
<link rel="apple-touch-icon" href="${b}assets/img/icone-180.png">
<link rel="manifest" href="${b}site.webmanifest">
<link rel="preload" as="font" type="font/woff2" href="${b}assets/fonts/mulish.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${b}assets/fonts/source-serif.woff2" crossorigin>
<link rel="stylesheet" href="${b}assets/css/site.css">
${jsonld}
</head>
<body${p.classe ? ` class="${p.classe}"` : ''}>
${cabecalho(p, ctx)}
<main id="conteudo">
${body}
</main>
${rodape(p, ctx)}
<script src="${b}assets/js/site.js" defer></script>
</body>
</html>
`;
}
