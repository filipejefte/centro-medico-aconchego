/* =========================================================================
   Gerador do site do Centro Médico Aconchego.

   Lê src/dados.mjs, monta cada página com src/paginas.mjs sobre a casca de
   src/chrome.mjs e grava HTML estático na raiz. O site publicado não depende
   deste script nem de nenhuma dependência externa: são arquivos.

     node build.mjs              produção, indexável, recusa dado pendente
     node build.mjs --preview    prévia, noindex, marca os dados a confirmar

   A recusa da produção é o ponto do desenho. Enquanto faltar horário de
   funcionamento ou nome do diretor técnico, este script não gera site
   indexável. Publicar horário errado de uma clínica manda gente para uma
   porta fechada.
   ========================================================================= */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLINICA } from './src/dados.mjs';
import { contexto, shell } from './src/chrome.mjs';
import * as PG from './src/paginas.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const PREVIA = process.argv.includes('--preview');
const ctx = contexto({ preview: PREVIA });

const paginas = [
  PG.inicio(ctx),
  PG.especialidades(ctx),
  PG.exames(ctx),
  PG.estrutura(ctx),
  PG.unidades(ctx),
  PG.instituicao(ctx),
  PG.agendamento(ctx),
  PG.contato(ctx),
  PG.privacidade(ctx),
  PG.naoEncontrada(ctx)
];

for (const pg of paginas) {
  const html = shell({ p: pg.p, ctx, body: pg.body, ld: pg.ld });
  const destino = join(RAIZ, pg.p.path);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, html);
}

/* --- manifesto ------------------------------------------------------- */

writeFileSync(join(RAIZ, 'site.webmanifest'), JSON.stringify({
  name: CLINICA.nome,
  short_name: CLINICA.nomeCurto,
  lang: 'pt-BR',
  start_url: './',
  scope: './',
  display: 'browser',
  background_color: '#fbf7f2',
  theme_color: '#316f98',
  icons: [
    { src: 'assets/img/icone-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/img/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
  ]
}, null, 2) + '\n');

/* --- sitemap e robots ------------------------------------------------ */

const publicas = paginas.filter(pg => pg.p.path !== '404.html');
const hoje = new Date().toISOString().slice(0, 10);

writeFileSync(join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicas.map(pg => `  <url><loc>${ctx.origem}/${pg.p.path === 'index.html' ? '' : pg.p.path}</loc><lastmod>${hoje}</lastmod></url>`).join('\n')}
</urlset>
`);

/* A prévia pede para não ser indexada, e pede de duas formas: aqui e na meta
   robots de cada página. Uma proposta de site para uma clínica real não pode
   disputar busca com a clínica. */
writeFileSync(join(RAIZ, 'robots.txt'), PREVIA
  ? 'User-agent: *\nDisallow: /\n'
  : `User-agent: *\nAllow: /\nSitemap: ${ctx.origem}/sitemap.xml\n`);

/* --- relatório ------------------------------------------------------- */

const pendentes = [...new Set(ctx.pendencias)];
console.log(`${paginas.length} páginas geradas em modo ${PREVIA ? 'prévia' : 'produção'}.`);
console.log(`Origem: ${ctx.origem}`);

if (pendentes.length) {
  console.log(`\n${pendentes.length} dado(s) a confirmar com a clínica:`);
  pendentes.forEach(x => console.log('  - ' + x));
  if (!PREVIA) {
    console.error('\nProdução recusada: preencha os campos em src/dados.mjs ou gere com --preview.');
    process.exitCode = 1;
  }
} else {
  console.log('Nenhum dado pendente.');
}
