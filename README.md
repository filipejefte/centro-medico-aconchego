# Centro Médico Aconchego

Proposta de site institucional e de agendamento para o **Centro Médico
Aconchego**, de Marília, SP, mantido pelo Hospital Espírita de Marília.

> **Esta é uma prévia de apresentação.** Não é o site oficial da clínica.
> Está publicada com `noindex` e com `robots.txt` bloqueando indexação, e traz
> uma faixa visível dizendo o que é. Os dados marcados como "a confirmar"
> precisam ser conferidos pela instituição antes de qualquer publicação.

---

## O problema que o site resolve

O levantamento que originou este projeto encontrou treze superfícies públicas
da clínica e **nenhuma** com caminho para marcar consulta ou exame sem
telefonar. Encontrou também duas unidades físicas em números diferentes da
mesma rua, sendo que a segunda não aparece em nenhum mapa.

Daí as duas decisões que atravessam o site inteiro:

1. **Toda página leva a agendar.** O botão fica fixo no topo e o formulário
   escolhe o telefone certo conforme o serviço, em vez de deixar a pessoa
   adivinhar entre vários números.
2. **Toda menção a serviço diz em qual número da rua ele fica.** Consultas,
   cirurgia e coleta no 430. Tomografia, ultrassonografia e radiografia no 340.

---

## Como funciona

Site **estático puro**. O que está publicado são arquivos HTML, uma folha de
estilo, um script pequeno, duas fontes e cinco imagens. Nenhuma dependência em
tempo de execução, nenhum servidor de aplicação, nenhum banco.

O HTML é gerado por um script Node sem pacotes instalados:

```
node build.mjs --preview     gera em modo prévia (noindex, marca dados pendentes)
node build.mjs               gera em modo produção
node tools/fontes.mjs        recorta as fontes ao que o site escreve
node tools/check.mjs         verificação completa
```

Quando a copy mudar, a ordem é `build`, depois `fontes`, depois `check`.

### Fonte única de verdade

Todo dado factual do site (telefones, endereços, especialidades, exames) vive
em `src/dados.mjs`. Nenhum número está escrito à mão dentro de HTML.

Campo com valor `null` é dado que ninguém confirmou. Na prévia ele vira uma
marcação visível "a confirmar"; **na build de produção ele derruba o
processo**. É de propósito: é melhor um site que não publica do que um site que
publica horário errado de uma clínica.

### Estrutura

```
build.mjs           monta as páginas e grava o HTML na raiz
src/dados.mjs       fonte única de verdade
src/chrome.mjs      <head>, cabeçalho, rodapé, ícones, botões
src/paginas.mjs     o conteúdo de cada página
tools/check.mjs     verificação estática, sai com código 1 se achar problema
tools/fontes.mjs    recorte das fontes
tools/imagens.ps1   gera o cartão de compartilhamento
assets/             css, js, fontes e imagens publicados
```

---

## Segurança e privacidade

O site foi feito para **não coletar nada**, e isso é verificável, não apenas
declarado.

- **CSP fechada.** `default-src 'none'`, com `connect-src 'none'`,
  `form-action 'none'` e `base-uri 'none'`. O navegador bloqueia qualquer
  tentativa de enviar dado para fora.
- **Zero terceiros.** Nenhum script, folha, fonte, mapa embutido ou pixel de
  fora. As fontes são hospedadas junto com o site.
- **Sem cookies, sem medição de audiência, sem publicidade.**
- **Sem estilo ou script embutido no HTML.** Nada de `style=`, `<style>` ou
  `on*=`, o que torna a CSP eficaz de verdade.
- `referrer: no-referrer`, e todo link externo com `noopener noreferrer`.

**Uma pendência que depende da hospedagem.** A diretiva `frame-ancestors`,
que impede o site de ser carregado dentro de um quadro de terceiro, só
funciona como cabeçalho HTTP; o navegador a ignora quando ela vem por `meta`.
O GitHub Pages não permite definir cabeçalho. Quando o site for para
hospedagem própria, configurar lá `Content-Security-Policy: frame-ancestors
'none'` (ou `X-Frame-Options: DENY`), junto com `Strict-Transport-Security` e
`X-Content-Type-Options: nosniff`.

### O agendamento não envia nada

O formulário monta uma frase com o que a pessoa escolheu e a coloca num link do
WhatsApp. **Todo o processamento acontece no aparelho da pessoa.** A mensagem
aparece inteira na tela antes de qualquer coisa; o aplicativo só abre se ela
tocar no botão, e ela decide se manda.

O formulário pede o mínimo: serviço, especialidade ou exame, forma de
atendimento, período e, opcionalmente, o primeiro nome. Não pede documento,
carteirinha, data de nascimento nem descrição de sintoma. São dados pessoais ou
de saúde, com proteção reforçada na LGPD, e não fazem falta para marcar um
horário.

Sem JavaScript o formulário deixa de montar a mensagem, mas os telefones e o
WhatsApp de cada serviço continuam escritos na página, como links diretos.

### O verificador

`tools/check.mjs` recusa a publicação se encontrar, entre outras coisas:

- link ou âncora quebrada, identificador repetido, arquivo referenciado que não
  existe
- página sem `lang`, título, descrição, canonical, `og:image`, `robots` ou CSP
- qualquer coisa que a CSP proibiria, e qualquer recurso carregado de fora
- link em nova aba sem `noopener noreferrer`, ou link em `http`
- termos vedados na publicidade médica (Resolução CFM 2.336/2023): promessa de
  resultado, superlativo, preço, gratuidade, antes e depois, depoimento
- nota de avaliação reproduzida, o que o material de origem veda expressamente
- identificação obrigatória ausente do rodapé
- vazamento de caminho, usuário ou máquina do ambiente de trabalho

Ele roda também no GitHub Actions, a cada envio.

---

## Marca

O logotipo do site é a **arte oficial da clínica**, publicada por ela própria
em 1080 px. Não houve recriação: o fundo azul foi removido calculando o canal
alfa por canal de cor, o que preserva o traçado e a suavização das bordas
originais.

A cor **#316F98** foi medida no fundo dessa arte, não escolhida. Toda a paleta
deriva dela. O terracota das ações é o complementar quase exato do azul, com
saturação e luminosidade equivalentes.

O ícone é o "A" com o acento, recortado da mesma arte com precisão de pixel.

---

## O que ainda falta

A prévia lista seis dados que só a instituição pode confirmar, e a build de
produção não roda sem eles:

- horário de funcionamento das unidades
- nome do diretor técnico e a inscrição no conselho (exigência da Resolução
  CFM 2.336/2023 para material de divulgação de estabelecimento de saúde)
- e-mail de atendimento
- lista de convênios aceitos
- encarregado pelo tratamento de dados, para a página de privacidade

Além disso: a lista de especialidades precisa ser conferida item a item, e não
há fotografia da clínica. O design foi feito para funcionar sem foto, com lugar
previsto para elas quando existirem.

---

## Licença e conteúdo

O nome, o logotipo e as informações institucionais pertencem ao Hospital
Espírita de Marília. Este repositório existe para apresentar a proposta à
instituição.
