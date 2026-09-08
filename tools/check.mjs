/* =========================================================================
   Verificação estática do site gerado. Sai com código 1 se encontrar
   qualquer um destes problemas:

   ESTRUTURA
   - link interno para arquivo inexistente, ou âncora que não existe no destino
   - identificador repetido na mesma página
   - arquivo referenciado (imagem, fonte, folha, script) que não está em disco
   - JSON-LD ou manifesto com JSON inválido
   - página sem lang, title, description, canonical, og:image, robots ou CSP
   - número de h1 diferente de um
   - robots.txt em desacordo com a meta robots das páginas

   SEGURANÇA
   - qualquer coisa que a CSP proibiria: estilo inline, bloco style,
     manipulador on*, URL javascript:, script ou folha de terceiros, iframe
   - recurso externo de qualquer tipo, inclusive imagem e fonte
   - link em nova aba sem noopener noreferrer, ou link em http
   - vazamento de dado do ambiente de trabalho em arquivo publicável

   CONFORMIDADE
   - termos vedados ou arriscados na publicidade médica (Resolução CFM
     2.336/2023 e Código de Ética Médica)
   - nota de avaliação reproduzida, o que o material de origem veda
   - identificação obrigatória ausente do rodapé
   - travessão ou meia-risca na copy, que é decisão editorial deste projeto

   Uso:  node tools/check.mjs
   ========================================================================= */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Duas varreduras, com alcances diferentes de propósito.

   PULAR_SITE é o que não faz parte do site servido: o gerador, a
   ferramentaria e o fluxo do CI. Essas pastas não passam pelas regras de
   HTML, porque tools/og.html é página de ferramenta e usa estilo embutido.

   PULAR_REPO é bem menor: só o que o .gitignore já segura, mais o .git. A
   varredura de vazamento usa esta, porque tools/ e .github/ VÃO para o
   repositório público e precisam ser conferidos como qualquer outro arquivo.
   Um caminho de máquina esquecido num script de build vaza igual. */
const PULAR_SITE = new Set(['src', 'tools', 'dist', 'node_modules', '.git', '.claude', '.github', 'interno']);
const PULAR_REPO = new Set(['dist', 'node_modules', '.git', '.claude', 'interno']);
const PUBLICAVEIS = /\.(html|css|js|mjs|xml|txt|json|yml|yaml|md|svg|webmanifest|ps1|nojekyll|gitignore)$/;

function varrer(dir, pular, acc = []) {
  for (const entrada of readdirSync(dir)) {
    if (pular.has(entrada)) { continue; }
    const p = join(dir, entrada);
    if (statSync(p).isDirectory()) { varrer(p, pular, acc); } else { acc.push(p); }
  }
  return acc;
}

const problemas = [];
const anota = (arquivo, msg) => problemas.push(`${relative(RAIZ, arquivo).replace(/\\/g, '/')}: ${msg}`);

const idsDe = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);

const arquivos = varrer(RAIZ, PULAR_SITE);
const doRepo = varrer(RAIZ, PULAR_REPO);
const paginas = arquivos.filter(f => f.endsWith('.html'));
const cacheIds = new Map();
const idsPara = (arquivo) => {
  if (!cacheIds.has(arquivo)) { cacheIds.set(arquivo, new Set(idsDe(readFileSync(arquivo, 'utf8')))); }
  return cacheIds.get(arquivo);
};

/* ------------------------------------------------------------------ */
/* Vazamento de dado do ambiente                                       */
/* ------------------------------------------------------------------ */

/* Padrões genéricos, que podem ficar num arquivo público sem revelar nada.

   As duas marcas abaixo existem porque este trecho contém, por definição,
   exatamente aquilo que ele procura. Sem elas o verificador se acusa. A
   varredura recorta o que está entre as marcas antes de testar, então o
   restante deste arquivo continua sendo conferido como qualquer outro: a
   isenção é do bloco, não do arquivo. */
/* varredura: ignorar daqui */
const vazamentos = [
  [/[A-Z]:\\/, 'caminho absoluto do Windows'],
  [/\\Users\\|\/Users\//, 'caminho de perfil de usuário'],
  [/AppData/i, 'caminho AppData'],
  [/Projetos/, 'nome da pasta de trabalho'],
  [/@gmail\.com|@hotmail\.com|@outlook\.com|@yahoo\./i, 'e-mail pessoal'],
  [/scratchpad|tool-results/i, 'caminho de ferramenta']
];
/* varredura: ate aqui */

/* Identificadores pessoais de verdade (nome da máquina, usuário, e-mail,
   nome completo) ficam em interno/identificadores.txt, que o .gitignore
   segura, uma expressão regular por linha. Assim o próprio verificador não
   publica aquilo que ele procura. */
const extra = join(RAIZ, 'interno', 'identificadores.txt');
if (existsSync(extra)) {
  for (const linha of readFileSync(extra, 'utf8').split(/\r?\n/)) {
    const t = linha.trim();
    if (t && !t.startsWith('#')) { vazamentos.push([new RegExp(t, 'i'), 'identificador pessoal']); }
  }
} else if (process.env.CI) {
  /* No CI a pasta interno/ não existe, porque o .gitignore a segura. Os
     padrões genéricos acima continuam valendo; só a lista pessoal não roda. */
  console.log('Aviso: interno/identificadores.txt não existe aqui (esperado no CI).');
} else {
  problemas.push('interno/identificadores.txt: ausente, a varredura de identificadores pessoais não rodou');
}

/* Vale para TODO arquivo de texto que vai para o repositório, inclusive
   tools/ e .github/. Um caminho absoluto esquecido num script de build fica
   tão público quanto uma página. */
for (const f of doRepo) {
  if (!PUBLICAVEIS.test(f)) { continue; }
  const txt = readFileSync(f, 'utf8')
    .replace(/\/\* varredura: ignorar daqui \*\/[\s\S]*?\/\* varredura: ate aqui \*\//g, '');
  for (const [re, rotulo] of vazamentos) {
    if (re.test(txt)) { anota(f, `vazamento de dado do ambiente (${rotulo})`); }
  }
}

/* O material de diagnóstico não pode chegar ao repositório público. */
const ignore = existsSync(join(RAIZ, '.gitignore')) ? readFileSync(join(RAIZ, '.gitignore'), 'utf8') : '';
if (!/^interno\/$/m.test(ignore)) { problemas.push('.gitignore: falta a linha "interno/"'); }

/* ------------------------------------------------------------------ */
/* Manifesto                                                           */
/* ------------------------------------------------------------------ */

const manifesto = join(RAIZ, 'site.webmanifest');
if (existsSync(manifesto)) {
  try { JSON.parse(readFileSync(manifesto, 'utf8')); }
  catch (e) { anota(manifesto, `manifesto inválido: ${e.message}`); }
}

/* ------------------------------------------------------------------ */
/* Páginas                                                             */
/* ------------------------------------------------------------------ */

let modoRobots = null;

for (const pagina of paginas) {
  const html = readFileSync(pagina, 'utf8');
  const lista = idsDe(html);
  const proprios = new Set(lista);
  cacheIds.set(pagina, proprios);
  const e404 = pagina.endsWith('404.html');

  /* --- identificadores repetidos --- */
  const vistos = new Set();
  for (const id of lista) {
    if (vistos.has(id)) { anota(pagina, `identificador repetido: ${id}`); }
    vistos.add(id);
  }

  /* --- links, âncoras e arquivos referenciados --- */
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(href)) { continue; }
    if (href.startsWith('#')) {
      if (href.length > 1 && !proprios.has(href.slice(1))) { anota(pagina, `âncora interna inexistente: ${href}`); }
      continue;
    }
    const [arquivo, hash] = href.split('#');
    const alvo = resolve(dirname(pagina), arquivo);
    if (!existsSync(alvo)) { anota(pagina, `referência quebrada: ${href}`); continue; }
    if (hash && alvo.endsWith('.html') && !idsPara(alvo).has(hash)) { anota(pagina, `âncora inexistente no destino: ${href}`); }
  }

  /* --- links externos --- */
  for (const m of html.matchAll(/<a\s[^>]*>/g)) {
    const tag = m[0];
    if (/target="_blank"/.test(tag) && !/rel="noopener noreferrer"/.test(tag)) {
      anota(pagina, `link em nova aba sem noopener noreferrer: ${tag.slice(0, 90)}`);
    }
    const href = tag.match(/href="([^"]+)"/);
    if (href && /^http:\/\//.test(href[1])) { anota(pagina, `link sem HTTPS: ${href[1]}`); }
  }

  /* --- JSON-LD --- */
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { anota(pagina, `JSON-LD inválido: ${e.message}`); }
  }

  /* --- metadados obrigatórios --- */
  if (!/<html lang="pt-BR">/.test(html)) { anota(pagina, 'atributo lang ausente ou diferente de pt-BR'); }
  if (!/<title>[^<]{10,}<\/title>/.test(html)) { anota(pagina, 'title ausente ou curto demais'); }
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc) { anota(pagina, 'meta description ausente'); }
  else if (desc[1].length < 70 || desc[1].length > 320) { anota(pagina, `meta description com ${desc[1].length} caracteres (ideal 70 a 320)`); }
  if (!/<link rel="canonical"/.test(html)) { anota(pagina, 'canonical ausente'); }
  if (!/<meta property="og:image" content="https:\/\//.test(html)) { anota(pagina, 'og:image ausente ou relativa'); }

  const robots = html.match(/<meta name="robots" content="([^"]+)"/);
  if (!robots) { anota(pagina, 'meta robots ausente'); }
  else if (modoRobots === null) { modoRobots = robots[1]; }
  else if (robots[1] !== modoRobots) { anota(pagina, `meta robots divergente das demais páginas (${robots[1]})`); }

  const h1 = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1 !== 1) { anota(pagina, `${h1} elementos h1 (deve haver exatamente 1)`); }

  /* --- o que a CSP proibiria --- */
  if (!/<meta http-equiv="Content-Security-Policy" content="default-src 'none'/.test(html)) { anota(pagina, 'CSP ausente ou permissiva'); }
  for (const diretiva of ["form-action 'none'", "connect-src 'none'", "frame-ancestors 'none'", "base-uri 'none'"]) {
    if (!html.includes(diretiva)) { anota(pagina, `CSP sem a diretiva ${diretiva}`); }
  }
  if (/\sstyle="/.test(html)) { anota(pagina, 'atributo style inline (bloqueado pela CSP)'); }
  if (/<style[\s>]/.test(html)) { anota(pagina, 'bloco style inline (bloqueado pela CSP)'); }
  if (/\son[a-z]+="/i.test(html)) { anota(pagina, 'manipulador de evento inline (bloqueado pela CSP)'); }
  if (/javascript:/i.test(html)) { anota(pagina, 'URL javascript:'); }
  if (/<iframe|<embed|<object/i.test(html)) { anota(pagina, 'conteúdo incorporado de terceiros'); }

  /* Qualquer recurso carregado de fora, de qualquer tipo. O único http
     externo permitido é link de navegação, tratado acima. */
  for (const m of html.matchAll(/(?:src|href)="((?:https?:)?\/\/[^"]+)"/g)) {
    const tagInicio = html.lastIndexOf('<', m.index);
    const tag = html.slice(tagInicio, html.indexOf('>', m.index) + 1);
    if (/^<a[\s>]/i.test(tag)) { continue; }
    if (/rel="canonical"/.test(tag) || /property="og:/.test(tag) || /name="twitter:/.test(tag)) { continue; }
    anota(pagina, `recurso carregado de fora do site: ${m[1].slice(0, 80)}`);
  }

  /* --- acessibilidade mínima --- */
  for (const m of html.matchAll(/<svg\s([^>]*)>/g)) {
    const attrs = m[1];
    if (!/aria-hidden="true"/.test(attrs) && !/role="img"/.test(attrs) && !/aria-label=/.test(attrs)) {
      anota(pagina, 'svg sem aria-hidden nem rótulo acessível');
    }
  }
  for (const m of html.matchAll(/<img\s([^>]*)>/g)) {
    if (!/\salt="/.test(m[1])) { anota(pagina, 'img sem atributo alt'); }
  }

  /* --- identificação obrigatória em publicidade de serviço de saúde --- */
  if (!e404) {
    if (!/Diretor técnico:/.test(html)) { anota(pagina, 'identificação do diretor técnico ausente no rodapé'); }
    if (!/CRM-SP/.test(html)) { anota(pagina, 'inscrição no conselho ausente no rodapé'); }
    if (!/não substituem a consulta médica/.test(html)) { anota(pagina, 'aviso de caráter informativo ausente'); }
    if (!/CNPJ/.test(html)) { anota(pagina, 'CNPJ do mantenedor ausente no rodapé'); }
  }

  /* --- vícios de escrita --- */
  const copy = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const travessao = (copy.match(/—/g) || []).length;
  if (travessao) { anota(pagina, `${travessao} travessão(ões) na copy; separe as frases`); }
  const meiaRisca = (copy.match(/–/g) || []).length;
  if (meiaRisca) { anota(pagina, `${meiaRisca} meia-risca(s) na copy; use "a" ou "até"`); }

  /* --- publicidade médica e reprodução de reputação --- */
  const vedados = [
    [/garant(imos|ia|ido)/i, 'promessa ou garantia de resultado'],
    [/100%/, 'percentual absoluto'],
    [/melhor\s+(cl[íi]nica|m[ée]dic|equipe|atendimento|servi[çc]o)/i, 'superlativo ou comparativo'],
    [/n[ºo°]?\s*1\s+(em|de)\b|l[íi]der\s+em|refer[êe]ncia\s+em/i, 'autoatribuição de liderança'],
    [/\bcura(r|do|da)?\b|milagr/i, 'promessa de cura'],
    [/resolvem?\s+(a\s+maior\s+parte|todos|tudo|qualquer)/i, 'promessa de resolução'],
    [/\bforma\s+mais\s+(simples|segura|eficaz|r[áa]pida|f[áa]cil)/i, 'superlativo de método'],
    [/promo[çc][ãa]o|desconto|parcelament|R\$\s?\d/i, 'preço, desconto ou condição de pagamento'],
    [/consulta\s+gr[áa]tis|consulta\s+gratuita|sem\s+custo/i, 'oferta de gratuidade'],
    [/antes\s+e\s+depois/i, 'imagem ou promessa antes e depois'],
    [/especialista/i, 'título de especialista (exige RQE conferido)'],
    [/depoimento|nossos\s+pacientes\s+dizem/i, 'depoimento de paciente'],
    [/sem\s+dor|indolor/i, 'promessa de ausência de dor'],
    [/tecnologia\s+de\s+ponta|[úu]ltima\s+gera[çc][ãa]o|exclusiv/i, 'autopromoção de equipamento ou exclusividade'],
    /* O material de origem veda expressamente reproduzir nota de avaliação
       em qualquer peça pública. Estas três linhas são essa trava. */
    [/avalia[çc][ãa]o\s+\d[.,]\d|\d[.,]\d\s*estrelas?/i, 'nota de avaliação reproduzida'],
    [/reclame\s*aqui|google\s+reviews/i, 'menção a plataforma de reputação']
  ];
  for (const [re, rotulo] of vedados) {
    if (re.test(copy)) { anota(pagina, `possível violação da publicidade médica: ${rotulo}`); }
  }
}

/* --- coerência do robots.txt com a meta robots --- */
const robotsTxt = join(RAIZ, 'robots.txt');
if (existsSync(robotsTxt)) {
  const txt = readFileSync(robotsTxt, 'utf8');
  const bloqueia = /Disallow:\s*\/\s*$/m.test(txt);
  const naoIndexa = (modoRobots || '').includes('noindex');
  if (bloqueia !== naoIndexa) {
    problemas.push(`robots.txt: ${bloqueia ? 'bloqueia tudo' : 'libera tudo'}, mas as páginas dizem "${modoRobots}"`);
  }
} else {
  problemas.push('robots.txt: ausente');
}

/* ------------------------------------------------------------------ */

console.log(`${paginas.length} páginas verificadas, ${arquivos.length} arquivos do site, ${doRepo.length} arquivos do repositório varridos por vazamento.`);
if (problemas.length) {
  console.log(`\n${problemas.length} problema(s):`);
  problemas.forEach(p => console.log('  - ' + p));
  process.exitCode = 1;
} else {
  console.log('Nenhum problema encontrado.');
}
