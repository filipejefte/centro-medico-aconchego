/* =========================================================================
   Reduz as duas fontes ao que este site realmente escreve.

   O conjunto de caracteres não é chutado: é lido do HTML já gerado. O script
   varre as páginas, tira as marcações, junta os caracteres que sobraram com
   um conjunto base do português e recorta as fontes exatamente nisso. Se
   amanhã a copy ganhar um caractere novo, basta rodar de novo.

   Na Source Serif o eixo óptico é fixado antes do recorte. Ela só aparece em
   título, onde o valor alto é o certo, e fixar o eixo tira boa parte do peso
   do arquivo.

   Depende de python com fontTools e brotli.

   Uso:  node build.mjs --preview  &&  node tools/fontes.mjs
   ========================================================================= */

import { execFileSync } from 'node:child_process';
import { statSync, existsSync, readFileSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(RAIZ, 'assets', 'fonts');

/* Conjunto base: o alfabeto do português, pontuação de texto e algarismos.
   Serve de piso, para o recorte não depender só do que a copy de hoje usa. */
const BASE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
  'ÀÁÂÃÄÇÈÉÊÍÏÓÔÕÖÚÜÑàáâãäçèéêíïóôõöúüñ' +
  ' .,;:!?()[]{}\'"/\\|@#$%&*+-=_<>~^`' + ' ­‘’“”…ºª°©®';

function caracteresDoSite() {
  const usados = new Set(BASE);
  for (const nome of readdirSync(RAIZ)) {
    if (!nome.endsWith('.html')) { continue; }
    const html = readFileSync(join(RAIZ, nome), 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;|&#\d+;/gi, ' ');
    for (const ch of html) {
      if (ch > ' ') { usados.add(ch); }
    }
  }
  return [...usados].sort().join('');
}

const FONTES = [
  { arquivo: 'mulish.woff2' },
  { arquivo: 'source-serif.woff2', opsz: 32 }
];

const py = (codigo) => execFileSync('python', ['-c', codigo], { encoding: 'utf8' });

const TEXTO = caracteresDoSite();
console.log(`Conjunto de recorte: ${TEXTO.length} caracteres, lidos do HTML gerado.`);

for (const { arquivo, opsz } of FONTES) {
  const caminho = join(DIR, arquivo);
  const original = join(DIR, arquivo.replace('.woff2', '.original.woff2'));
  if (!existsSync(caminho)) { console.log(`  ${arquivo}: ausente, pulando`); continue; }

  /* Guarda o arquivo cheio na primeira passada. Sem isso, rodar o script
     duas vezes recorta um arquivo já recortado e perde glifo para sempre. */
  if (!existsSync(original)) { copyFileSync(caminho, original); }

  const antes = statSync(original).size;

  const codigo = [
    'import io',
    'from fontTools.ttLib import TTFont',
    'from fontTools import subset',
    opsz ? 'from fontTools.varLib.instancer import instantiateVariableFont' : '',
    `f = TTFont(r"${original}", lazy=False)`,
    /* Instanciar e recortar no mesmo objeto quebra: a tabela de variações
       fica sem entrada para glifos que não variam. Gravar e reabrir
       normaliza as tabelas antes do recorte. */
    opsz ? `f = instantiateVariableFont(f, {"opsz": ${opsz}}, inplace=True, updateFontNames=False)` : '',
    opsz ? 'buf = io.BytesIO()' : '',
    opsz ? 'f.flavor = None' : '',
    opsz ? 'f.save(buf)' : '',
    opsz ? 'buf.seek(0)' : '',
    opsz ? 'f = TTFont(buf, lazy=False)' : '',
    'o = subset.Options()',
    'o.layout_features = ["kern","liga","clig","calt","ccmp","locl","mark","mkmk","rlig"]',
    'o.name_IDs = ["*"]',
    'o.drop_tables = ["DSIG"]',
    'o.retain_gids = False',
    's = subset.Subsetter(options=o)',
    `s.populate(text=${JSON.stringify(TEXTO)})`,
    's.subset(f)',
    /* Confere que nenhum caractere pedido ficou de fora. */
    'cmap = f.getBestCmap()',
    `faltando = [c for c in ${JSON.stringify(TEXTO)} if ord(c) not in cmap]`,
    'print("FALTANDO:" + "".join(faltando)) if faltando else None',
    'f.flavor = "woff2"',
    `f.save(r"${caminho}")`
  ].filter(Boolean).join('\n');

  const saida = py(codigo).trim();
  if (saida.startsWith('FALTANDO:')) {
    console.log(`  ${arquivo}: a fonte não tem estes caracteres: ${saida.slice(9)}`);
  }

  const depois = statSync(caminho).size;
  console.log(`  ${arquivo.padEnd(22)} ${String(antes).padStart(7)} -> ${String(depois).padStart(6)} bytes  (-${Math.round((1 - depois / antes) * 100)}%)`);
}
