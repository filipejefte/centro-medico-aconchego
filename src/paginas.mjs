/* =========================================================================
   As páginas do site.

   Cada função devolve { p, body, ld }:
     p    metadados da página (caminho, base relativa, título, descrição)
     body o HTML do <main>
     ld   o JSON-LD, quando a página tem algo estruturado a dizer

   O QUE ESTE SITE ESTÁ TENTANDO RESOLVER
   O diagnóstico dá nota 1 para a etapa de contato: treze superfícies
   públicas, nenhuma com caminho para marcar sem telefonar, e sete telefones
   em circulação. E dá nota 2 para descoberta, porque a unidade de exames não
   existe em nenhum mapa e o paciente é mandado para o prédio errado.

   Daí as duas decisões de arquitetura que atravessam o site inteiro:

   1. TODA PÁGINA LEVA A AGENDAR. O botão do cabeçalho é fixo, o formulário
      escolhe o telefone certo pela pessoa, e nenhuma tela termina sem uma
      saída para marcar.

   2. TODA MENÇÃO A SERVIÇO DIZ EM QUAL NÚMERO DA RUA ELE FICA. O número 430
      e o número 340 aparecem grandes, repetidos e sempre juntos do serviço.
      Não é redundância: é a correção do erro mais caro do diagnóstico.
   ========================================================================= */

import {
  CLINICA, UNIDADES, CANAIS, ESPECIALIDADES, EXAMES, LEVAR,
  ESTRUTURA, UCP, ATENDIMENTO, CONTATO
} from './dados.mjs';
import { esc, ICO, botao, logo } from './chrome.mjs';

const ANO = new Date().getFullYear();
const IDADE_HEM = ANO - CLINICA.mantenedorDesde;

const U = Object.fromEntries(UNIDADES.map(u => [u.id, u]));
const C = Object.fromEntries(CANAIS.map(c => [c.id, c]));

/* ------------------------------------------------------------------ */
/* Peças reaproveitadas                                                */
/* ------------------------------------------------------------------ */

/** Cabeçalho padrão das páginas internas. */
const cabecaPagina = ({ base, titulo, entrada, migalha }) => `
<section class="pagina-cabeca">
  <div class="env">
    ${migalha ? `<p class="migalhas"><a href="${base}index.html">Início</a> <span aria-hidden="true">/</span> ${esc(migalha)}</p>` : ''}
    <h1>${titulo}</h1>
    <p class="entrada">${entrada}</p>
  </div>
</section>`;

/** Bloco de uma unidade, com o número da rua em destaque. */
const blocoUnidade = (u, base) => `
<article class="unidade" id="${esc(u.id)}">
  <div>
    <p class="unidade-numero"><span>Número</span> <b>${esc(u.numero)}</b></p>
    <h3>${esc(u.nome)}</h3>
    <p class="endereco">
      ${esc(u.logradouro)}, <b>${esc(u.numero)}</b><br>
      ${esc(u.bairro)}, ${esc(u.cidade)} ${esc(u.uf)}<br>
      CEP ${esc(u.cep)}
    </p>
    <div class="grupo-botoes">
      ${botao({ href: u.mapa, texto: 'Abrir no mapa', tipo: 'secundario', icone: ICO.local, externo: true })}
    </div>
  </div>
  <div>
    <h4>O que é atendido aqui</h4>
    <ul class="lista-check">
      ${u.atendeAqui.map(x => `<li>${ICO.check}<span>${esc(x)}</span></li>`).join('')}
    </ul>
    ${botao({ href: `${base}agendamento.html`, texto: 'Agendar nesta unidade', tipo: 'principal', icone: ICO.calendario })}
  </div>
</article>`;

/** Chamada de fechamento, igual em todas as páginas de conteúdo. */
const chamadaFinal = (base, texto) => `
<section class="secao">
  <div class="env">
    <div class="chamada">
      <h2>Vamos marcar?</h2>
      <p>${texto}</p>
      <div class="grupo-botoes">
        ${botao({ href: `${base}agendamento.html`, texto: 'Agendar atendimento', tipo: 'claro', icone: ICO.calendario })}
        ${botao({ href: C.consultas.whatsappLink, texto: 'Falar no WhatsApp', tipo: 'fantasma', icone: ICO.whatsapp, externo: true })}
      </div>
    </div>
  </div>
</section>`;

/** Aviso fixo sobre onde fica cada serviço. */
const avisoDuasUnidades = (base) => `
<div class="aviso">
  ${ICO.local}
  <div>
    <p><b>São dois endereços na mesma rua.</b> Consultas, cirurgias e coleta de exames de sangue ficam no número <b>430</b>. Tomografia, ultrassonografia e radiografia ficam no número <b>340</b>.</p>
    <p>Ao marcar, confirme o número para onde você deve ir. <a href="${base}unidades.html">Ver as duas unidades</a>.</p>
  </div>
</div>`;

/* JSON-LD da organização, reaproveitado em várias páginas. */
const ldOrganizacao = (origem) => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalClinic',
  '@id': `${origem}/#clinica`,
  name: CLINICA.nome,
  alternateName: ['Clínica Aconchego', 'Aconchego Centro Médico e Diagnóstico'],
  url: `${origem}/`,
  description: `${CLINICA.assinatura} em ${CLINICA.cidade}, ${CLINICA.uf}. Consultas nas especialidades, exames de imagem, cirurgias de pequena e média complexidade e internação.`,
  telephone: `+${C.consultas.e164}`,
  parentOrganization: {
    '@type': 'Organization',
    name: CLINICA.mantenedor,
    foundingDate: String(CLINICA.mantenedorDesde)
  },
  address: UNIDADES.map(u => ({
    '@type': 'PostalAddress',
    streetAddress: `${u.logradouro}, ${u.numero}`,
    addressLocality: u.cidade,
    addressRegion: u.uf,
    postalCode: u.cep,
    addressCountry: 'BR'
  })),
  availableService: [
    ...ESPECIALIDADES.map(e => ({ '@type': 'MedicalProcedure', name: e.nome })),
    ...EXAMES.map(e => ({ '@type': 'MedicalTest', name: e.nome }))
  ]
});

/* ------------------------------------------------------------------ */
/* Início                                                              */
/* ------------------------------------------------------------------ */

export function inicio(ctx) {
  const base = '';

  const caminhos = [
    { id: 'consulta', ico: ICO.estetoscopio, titulo: 'Marcar uma consulta', sub: 'Dezesseis especialidades, no número 430' },
    { id: 'exame-imagem', ico: ICO.imagem, titulo: 'Agendar um exame', sub: 'Tomografia, ultrassom e raio X, no número 340' },
    { id: 'oftalmologia', ico: ICO.olho, titulo: 'Oftalmologia', sub: 'Agenda e telefone próprios, no número 430' }
  ].map(c => `
    <a class="caminho" href="agendamento.html#${esc(c.id)}">
      <span class="caminho-ico">${c.ico}</span>
      <span><b>${esc(c.titulo)}</b><span>${esc(c.sub)}</span></span>
      ${ICO.seta}
    </a>`).join('');

  const especialidadesResumo = ESPECIALIDADES.slice(0, 6).map(e =>
    `<li>${ICO.check}<span>${esc(e.nome)}</span></li>`).join('');

  const body = `
<section class="hero">
  <div class="env hero-grade">
    <div class="hero-texto">
      <span class="sobrenome">${esc(CLINICA.assinatura)}</span>
      <h1>Consultas, exames e cirurgias em ${esc(CLINICA.cidade)}.</h1>
      <p class="hero-chamada">
        O ${esc(CLINICA.nome)} é mantido pelo ${esc(CLINICA.mantenedor)}, instituição sem fins lucrativos que cuida da cidade há ${IDADE_HEM} anos. São duas unidades vizinhas no Alto Cafezal, uma para consultas e cirurgias, outra para exames de imagem.
      </p>
      <ul class="hero-selos">
        <li>${ICO.coracao}<span>Mantido pelo ${esc(CLINICA.mantenedorSigla)} desde ${CLINICA.mantenedorDesde}</span></li>
        <li>${ICO.documento}<span>SUS, convênios e particular</span></li>
        <li>${ICO.cama}<span>Internação e centro cirúrgico</span></li>
      </ul>
    </div>

    <div class="escolha">
      <h2>Do que você precisa?</h2>
      <p>Escolha abaixo. A gente já leva você para o telefone certo e diz em qual número da rua fica.</p>
      <div class="caminhos">${caminhos}</div>
      <p class="escolha-nota">
        Prefere falar agora? WhatsApp <a href="${esc(C.consultas.whatsappLink)}" target="_blank" rel="noopener noreferrer">${esc(CONTATO.whatsapp.numero)}</a> ou consultas pelo <a href="tel:+${esc(C.consultas.e164)}">${esc(C.consultas.telefone)}</a>.
      </p>
    </div>
  </div>
</section>

<section class="secao">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Onde fica cada coisa</span>
      <h2>Duas unidades, na mesma rua.</h2>
      <p>A pessoa que marca um exame e a que marca uma consulta não vão para o mesmo prédio. Confira o número antes de sair de casa.</p>
    </div>
    ${UNIDADES.map(u => blocoUnidade(u, base)).join('')}
  </div>
</section>

<section class="secao secao-veu">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Atendimento</span>
      <h2>Dezesseis especialidades, em nove consultórios.</h2>
      <p>Consultas eletivas no Centro Médico, com encaminhamento para exame, cirurgia ou internação sem sair da instituição.</p>
    </div>
    <div class="grade grade-2">
      <div class="cartao">
        <div class="cartao-ico">${ICO.estetoscopio}</div>
        <h3>Consultas nas especialidades</h3>
        <p>De clínica médica e pediatria a cardiologia, ortopedia e ginecologia. Quem não sabe qual especialidade procurar começa pela clínica médica.</p>
        <ul class="lista-check">${especialidadesResumo}</ul>
        <p>${botao({ href: 'especialidades.html', texto: 'Ver as dezesseis', tipo: 'secundario', icone: ICO.seta })}</p>
      </div>
      <div class="cartao">
        <div class="cartao-ico">${ICO.imagem}</div>
        <h3>Exames de imagem e laboratório</h3>
        <p>Tomografia, ultrassonografia e radiografia ficam na unidade de Diagnóstico por Imagem, no número 340. As análises clínicas são coletadas no Centro Médico, no 430.</p>
        <ul class="lista-check">
          ${EXAMES.map(e => `<li>${ICO.check}<span>${esc(e.nome)}</span></li>`).join('')}
        </ul>
        <p>${botao({ href: 'exames.html', texto: 'Como agendar um exame', tipo: 'secundario', icone: ICO.seta })}</p>
      </div>
    </div>
  </div>
</section>

<section class="secao">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Estrutura</span>
      <h2>Muito mais do que consultório.</h2>
      <p>O Centro Médico tem centro cirúrgico, enfermaria e leitos de recuperação no próprio prédio. Quem consulta aqui pode operar e se recuperar aqui.</p>
    </div>
    <div class="grade grade-3">
      ${ESTRUTURA.slice(0, 6).map(e => `
      <div class="cartao">
        <h3>${esc(e.nome)}</h3>
        <p>${esc(e.sobre)}</p>
      </div>`).join('')}
    </div>
    <div class="grupo-botoes">
      ${botao({ href: 'estrutura.html', texto: 'Conhecer a estrutura', tipo: 'secundario', icone: ICO.seta })}
    </div>
  </div>
</section>

<section class="secao secao-azul">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Como marcar</span>
      <h2>Três passos, sem adivinhar telefone.</h2>
      <p>Hoje circulam vários números por setor. Aqui você diz o que precisa e o site escolhe o número certo.</p>
    </div>
    <ol class="passos">
      <li class="passo">
        <div>
          <h3>Diga o que você precisa</h3>
          <p>Consulta, exame de imagem ou oftalmologia. Se não souber a especialidade, é só dizer que precisa de orientação.</p>
        </div>
      </li>
      <li class="passo">
        <div>
          <h3>Confira a mensagem</h3>
          <p>O site escreve a mensagem para você e mostra por inteiro antes de mandar. Nada é enviado sem você ver e apertar o botão.</p>
        </div>
      </li>
      <li class="passo">
        <div>
          <h3>Fale pelo WhatsApp ou ligue</h3>
          <p>A recepção confirma horário, forma de atendimento e o número da rua para onde você deve ir.</p>
        </div>
      </li>
    </ol>
    <div class="grupo-botoes">
      ${botao({ href: 'agendamento.html', texto: 'Começar agora', tipo: 'claro', icone: ICO.calendario })}
    </div>
  </div>
</section>

<section class="secao secao-veu">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Formas de atendimento</span>
      <h2>SUS, convênio ou particular.</h2>
    </div>
    <div class="grade grade-3">
      ${ATENDIMENTO.map(a => `
      <div class="cartao">
        <h3>${esc(a.nome)}</h3>
        <p>${esc(a.sobre)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="secao">
  <div class="env env-estreito">
    <div class="cabeca-secao">
      <span class="sobrenome">A instituição</span>
      <h2>Há ${IDADE_HEM} anos em ${esc(CLINICA.cidade)}.</h2>
    </div>
    <div class="prosa">
      <p>O ${esc(CLINICA.mantenedor)} foi fundado em ${CLINICA.mantenedorDesde} e é uma ${esc(CLINICA.naturezaJuridica.toLowerCase())}. Em ${CLINICA.inauguracao} abriu o ${esc(CLINICA.nome)} para atender a cidade e a região em especialidades, exames e cirurgias, e para dar retaguarda clínica ao próprio hospital.</p>
      <p>Parte do atendimento é feita em parceria com a Prefeitura de ${esc(CLINICA.cidade)}, pelo Sistema Único de Saúde. O restante é por convênio ou particular.</p>
      <p>${botao({ href: 'instituicao.html', texto: 'Sobre a instituição', tipo: 'secundario', icone: ICO.seta })}</p>
    </div>
  </div>
</section>

${chamadaFinal(base, 'Escolha o serviço, confira a mensagem e fale com a recepção. Leva menos de um minuto.')}
`;

  return {
    p: {
      path: 'index.html', base, titulo: 'Início', classe: 'pg-inicio',
      descricao: `${CLINICA.nome} em ${CLINICA.cidade} SP. Consultas em dezesseis especialidades, exames de imagem, cirurgias e internação. Mantido pelo ${CLINICA.mantenedor}. Atende SUS, convênios e particular.`
    },
    body,
    ld: ldOrganizacao(ctx.origem)
  };
}

/* ------------------------------------------------------------------ */
/* Especialidades                                                      */
/* ------------------------------------------------------------------ */

export function especialidades(ctx) {
  const base = '';

  const lista = ESPECIALIDADES.map(e => `
    <div class="esp">
      <h3>${esc(e.nome)}</h3>
      <p>${esc(e.sobre)}</p>
      ${e.telefone ? `<a class="esp-tel" href="tel:+${esc(C.oftalmologia.e164)}">${ICO.telefone}<span>${esc(e.telefone)}</span></a>` : ''}
    </div>`).join('');

  const body = `
${cabecaPagina({
    base, migalha: 'Especialidades',
    titulo: 'Especialidades',
    entrada: `São dezesseis áreas de atendimento em nove consultórios, todas no Centro Médico, no número <b>430</b> da Rua Dr. Joaquim de Abreu Sampaio Vidal.`
  })}

<section class="secao">
  <div class="env">
    ${avisoDuasUnidades(base)}

    <div class="nota">
      <p><b>Não sabe qual procurar?</b> Comece pela clínica médica. É a consulta que avalia a queixa geral e encaminha para a área certa, sem você precisar acertar de primeira.</p>
    </div>

    <div class="especialidades">${lista}</div>
  </div>
</section>

<section class="secao secao-veu">
  <div class="env env-estreito prosa">
    <h2>Como funciona a consulta</h2>
    <p>As consultas são eletivas, ou seja, marcadas com antecedência. O atendimento pode ser pelo SUS, com encaminhamento da rede municipal, por convênio ou particular.</p>
    <p>Se a avaliação indicar exame de imagem, ele é agendado na unidade de Diagnóstico por Imagem, no número 340 da mesma rua. Se indicar cirurgia de pequena ou média complexidade, ela pode ser feita no centro cirúrgico do próprio Centro Médico, com internação no local.</p>
    <h3>O que levar</h3>
    <ul>${LEVAR.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  </div>
</section>

${chamadaFinal(base, 'Diga a especialidade que você procura, ou peça orientação se ainda não souber.')}
`;

  return {
    p: {
      path: 'especialidades.html', base, titulo: 'Especialidades',
      descricao: `Dezesseis especialidades no ${CLINICA.nome}, em ${CLINICA.cidade}: clínica médica, cardiologia, ortopedia, ginecologia, pediatria, oftalmologia e outras. Consultas por SUS, convênio ou particular no número 430.`
    },
    body,
    ld: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Especialidades do ${CLINICA.nome}`,
      itemListElement: ESPECIALIDADES.map((e, i) => ({
        '@type': 'ListItem', position: i + 1, name: e.nome
      }))
    }
  };
}

/* ------------------------------------------------------------------ */
/* Exames                                                              */
/* ------------------------------------------------------------------ */

export function exames(ctx) {
  const base = '';
  const imagem = U['diagnostico-por-imagem'];

  const body = `
${cabecaPagina({
    base, migalha: 'Exames',
    titulo: 'Exames de imagem e laboratório',
    entrada: `Tomografia, ultrassonografia e radiografia ficam na unidade de Diagnóstico por Imagem, no número <b>340</b>. As análises clínicas são coletadas no Centro Médico, no <b>430</b>.`
  })}

<section class="secao">
  <div class="env">
    <div class="aviso">
      ${ICO.local}
      <div>
        <p><b>Atenção ao endereço do exame de imagem.</b> A unidade de Diagnóstico por Imagem fica no número <b>340</b> da Rua Dr. Joaquim de Abreu Sampaio Vidal, e não no mesmo prédio das consultas.</p>
        <p>É a poucos metros do Centro Médico, na mesma rua e no mesmo bairro. Se estiver usando aplicativo de mapa, confira se o número que aparece é o 340 antes de sair.</p>
      </div>
    </div>

    <div class="grade grade-dupla">
      ${EXAMES.map(e => `
      <div class="cartao">
        <div class="cartao-ico">${e.unidade === 'centro-medico' ? ICO.documento : ICO.imagem}</div>
        <h3>${esc(e.nome)}</h3>
        <p>${esc(e.sobre)}</p>
        <p><b>Onde:</b> ${esc(U[e.unidade].nome)}, número ${esc(U[e.unidade].numero)}.</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="secao secao-veu">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Antes do exame</span>
      <h2>O que levar, e o que perguntar.</h2>
      <p>Alguns exames pedem preparo, como jejum ou beber água antes. O preparo muda conforme o exame que o médico pediu.</p>
    </div>
    <div class="grade grade-2">
      <div class="cartao">
        <h3>Leve com você</h3>
        <ul class="lista-check">
          ${LEVAR.map(x => `<li>${ICO.check}<span>${esc(x)}</span></li>`).join('')}
        </ul>
      </div>
      <div class="cartao">
        <h3>Pergunte ao agendar</h3>
        <ul class="lista-check">
          <li>${ICO.check}<span>Se o exame pede jejum, e de quantas horas</span></li>
          <li>${ICO.check}<span>Se precisa tomar água ou algum remédio antes</span></li>
          <li>${ICO.check}<span>Quanto tempo o exame costuma levar</span></li>
          <li>${ICO.check}<span>Se você pode dirigir depois</span></li>
          <li>${ICO.check}<span>Em qual número da rua você deve entrar</span></li>
        </ul>
      </div>
    </div>
    <div class="nota">
      <p><b>O preparo específico é informado no agendamento</b>, por quem sabe qual exame foi pedido. Se ficar qualquer dúvida depois, ligue antes de vir: é melhor perguntar do que perder a viagem.</p>
    </div>
  </div>
</section>

<section class="secao">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Agendar</span>
      <h2>Como marcar um exame</h2>
    </div>
    <div class="grade grade-2">
      <div class="canal">
        <h3>${esc(C.exames.titulo)}</h3>
        <p class="canal-onde">${ICO.local}<span>${esc(imagem.nome)}, número ${esc(imagem.numero)}</span></p>
        <p>${esc(C.exames.descricao)}</p>
        <div class="canal-acoes">
          ${botao({ href: `${base}agendamento.html#exame-imagem`, texto: 'Agendar pelo site', tipo: 'principal', icone: ICO.calendario })}
          ${botao({ href: C.exames.whatsappLink, texto: 'Falar no WhatsApp', tipo: 'zap', icone: ICO.whatsapp, externo: true })}
          ${botao({ href: `tel:+${C.exames.e164}`, texto: `Ligar ${C.exames.telefone}`, tipo: 'secundario', icone: ICO.telefone })}
        </div>
      </div>
      <div class="cartao">
        <h3>Resultado do exame</h3>
        <p>A retirada do resultado e o prazo são informados no dia do exame. Guarde o comprovante que a recepção entregar: é ele que identifica o seu exame na hora de retirar.</p>
        <p>Se você fizer o exame por encaminhamento, o resultado costuma ser levado de volta ao médico que pediu, na consulta de retorno.</p>
      </div>
    </div>
  </div>
</section>

${chamadaFinal(base, 'Tenha o pedido do médico em mãos. É ele que diz qual exame agendar e qual preparo é necessário.')}
`;

  return {
    p: {
      path: 'exames.html', base, titulo: 'Exames',
      descricao: `Tomografia, ultrassonografia e radiografia no ${CLINICA.nome}, em ${CLINICA.cidade}. A unidade de Diagnóstico por Imagem fica no número 340 da Rua Dr. Joaquim de Abreu Sampaio Vidal. Saiba o que levar e como agendar.`
    },
    body,
    ld: {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: `${CLINICA.nome}, ${imagem.nome}`,
      url: `${ctx.origem}/exames.html`,
      telephone: `+${C.exames.e164}`,
      parentOrganization: { '@type': 'Organization', name: CLINICA.mantenedor },
      address: {
        '@type': 'PostalAddress',
        streetAddress: `${imagem.logradouro}, ${imagem.numero}`,
        addressLocality: imagem.cidade,
        addressRegion: imagem.uf,
        postalCode: imagem.cep,
        addressCountry: 'BR'
      },
      availableService: EXAMES.filter(e => e.unidade === imagem.id).map(e => ({ '@type': 'MedicalTest', name: e.nome }))
    }
  };
}

/* ------------------------------------------------------------------ */
/* Estrutura                                                           */
/* ------------------------------------------------------------------ */

export function estrutura(ctx) {
  const base = '';

  const body = `
${cabecaPagina({
    base, migalha: 'Estrutura',
    titulo: 'Estrutura',
    entrada: 'O Centro Médico não é só consultório. Tem centro cirúrgico, enfermaria 24 horas, sala de estabilização e leitos de recuperação no mesmo prédio das consultas.'
  })}

<section class="secao">
  <div class="env">
    <div class="grade grade-3">
      ${ESTRUTURA.map(e => `
      <div class="cartao">
        <h3>${esc(e.nome)}</h3>
        <p>${esc(e.sobre)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="secao secao-veu">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Desde ${UCP.desde}</span>
      <h2>${esc(UCP.titulo)}</h2>
      <p>São ${UCP.leitos} leitos para quem já passou da fase aguda, mas ainda não tem condição de ir para casa. A permanência é de ${esc(UCP.permanencia)}.</p>
    </div>
    <div class="grade grade-2">
      <div class="cartao">
        <h3>Para quem é</h3>
        <p>Pacientes em recuperação depois de cirurgia, ou com mais de uma condição de saúde ao mesmo tempo, que precisam de acompanhamento contínuo por mais tempo do que uma internação comum.</p>
      </div>
      <div class="cartao">
        <h3>Quem acompanha</h3>
        <ul class="lista-check">
          ${UCP.equipe.map(x => `<li>${ICO.check}<span>${esc(x)}</span></li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="nota">
      <p><b>O acesso à internação é por indicação médica.</b> Ela parte da avaliação do médico que acompanha o caso, seja em consulta na própria clínica, seja por encaminhamento de outro serviço.</p>
    </div>
  </div>
</section>

<section class="secao">
  <div class="env env-estreito prosa">
    <h2>Cirurgias</h2>
    <p>O centro cirúrgico tem duas salas e atende casos de pequena e média complexidade. Quem passa por cirurgia aqui é internado no próprio prédio, com enfermaria 24 horas e leitos de retaguarda.</p>
    <p>A indicação cirúrgica é feita em consulta, pela especialidade que acompanha o caso. O agendamento da cirurgia e as orientações de preparo são passados pela equipe depois dessa avaliação.</p>
    <h2>Emergência</h2>
    <p>O Centro Médico tem sala de estabilização, estrutura para o primeiro atendimento de casos graves enquanto o paciente é avaliado e encaminhado.</p>
    <div class="aviso">
      ${ICO.alerta}
      <div>
        <p><b>Em emergência, não marque pelo site e não espere resposta de mensagem.</b> Procure o serviço de urgência mais próximo ou ligue para o SAMU, no <a href="tel:192">192</a>.</p>
      </div>
    </div>
  </div>
</section>

${chamadaFinal(base, 'Para avaliar uma cirurgia ou entender se o caso tem indicação de internação, comece por uma consulta.')}
`;

  return {
    p: {
      path: 'estrutura.html', base, titulo: 'Estrutura',
      descricao: `Estrutura do ${CLINICA.nome} em ${CLINICA.cidade}: nove consultórios, centro cirúrgico com duas salas, enfermaria 24 horas, sala de estabilização e Unidade de Cuidados Prolongados com ${UCP.leitos} leitos.`
    },
    body,
    ld: null
  };
}

/* ------------------------------------------------------------------ */
/* Unidades                                                            */
/* ------------------------------------------------------------------ */

export function unidades(ctx) {
  const base = '';

  const body = `
${cabecaPagina({
    base, migalha: 'Unidades',
    titulo: 'As duas unidades',
    entrada: 'O Centro Médico Aconchego ocupa dois endereços na Rua Dr. Joaquim de Abreu Sampaio Vidal, no Alto Cafezal. Um para consultas e cirurgias, outro para exames de imagem.'
  })}

<section class="secao">
  <div class="env">
    <div class="aviso">
      ${ICO.local}
      <div>
        <p><b>Confira o número da rua antes de sair de casa.</b> Os dois endereços ficam na mesma via e a poucos metros um do outro, o que torna fácil ir parar no prédio errado.</p>
        <p>Se você marcou pelo telefone, pergunte para qual número deve ir. Se marcou pelo site, o número está na mensagem.</p>
      </div>
    </div>
    ${UNIDADES.map(u => blocoUnidade(u, base)).join('')}
  </div>
</section>

<section class="secao secao-veu">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Na dúvida</span>
      <h2>Para onde eu vou?</h2>
    </div>
    <div class="grade grade-2">
      <div class="cartao">
        <div class="cartao-ico">${ICO.estetoscopio}</div>
        <h3>Vá para o número 430</h3>
        <ul class="lista-check">
          <li>${ICO.check}<span>Consulta com qualquer especialidade</span></li>
          <li>${ICO.check}<span>Consulta e exame de oftalmologia</span></li>
          <li>${ICO.check}<span>Coleta de sangue e análises clínicas</span></li>
          <li>${ICO.check}<span>Cirurgia agendada e internação</span></li>
          <li>${ICO.check}<span>Visita a paciente internado</span></li>
        </ul>
      </div>
      <div class="cartao">
        <div class="cartao-ico">${ICO.imagem}</div>
        <h3>Vá para o número 340</h3>
        <ul class="lista-check">
          <li>${ICO.check}<span>Tomografia</span></li>
          <li>${ICO.check}<span>Ultrassonografia</span></li>
          <li>${ICO.check}<span>Radiografia, o raio X</span></li>
        </ul>
      </div>
    </div>
    <div class="nota">
      <p><b>Horário de funcionamento das unidades:</b> ${ctx.dado(CLINICA.horarios, 'Horário de funcionamento')}</p>
    </div>
  </div>
</section>

${chamadaFinal(base, 'Ao agendar, a mensagem já sai com o número da rua para onde você deve ir.')}
`;

  return {
    p: {
      path: 'unidades.html', base, titulo: 'Unidades',
      descricao: `Endereços do ${CLINICA.nome} em ${CLINICA.cidade}: Centro Médico no número 430 e Diagnóstico por Imagem no número 340 da Rua Dr. Joaquim de Abreu Sampaio Vidal, Alto Cafezal. Veja o que é atendido em cada um.`
    },
    body,
    ld: ldOrganizacao(ctx.origem)
  };
}

/* ------------------------------------------------------------------ */
/* Instituição                                                         */
/* ------------------------------------------------------------------ */

export function instituicao(ctx) {
  const base = '';

  const body = `
${cabecaPagina({
    base, migalha: 'A instituição',
    titulo: `Mantido pelo ${esc(CLINICA.mantenedor)}`,
    entrada: `Uma ${esc(CLINICA.naturezaJuridica.toLowerCase())} fundada em ${CLINICA.mantenedorDesde}, que abriu o Centro Médico Aconchego em ${CLINICA.inauguracao} para atender ${esc(CLINICA.cidade)} e a região.`
  })}

<section class="secao">
  <div class="env env-estreito prosa">
    <h2>Há ${IDADE_HEM} anos na cidade</h2>
    <p>O ${esc(CLINICA.mantenedor)} foi fundado em ${CLINICA.mantenedorDesde} e mantém desde então atendimento em saúde em ${esc(CLINICA.cidade)}. É uma ${esc(CLINICA.naturezaJuridica.toLowerCase())}, o que significa que o resultado da operação volta para a própria atividade assistencial.</p>
    <p>Em ${CLINICA.inauguracao} a instituição abriu o ${esc(CLINICA.nome)}, com consultórios, salas de exame e centro cirúrgico. A ideia era dar à cidade um lugar para consulta, exame e cirurgia de pequena e média complexidade, e ao mesmo tempo dar retaguarda clínica ao hospital.</p>
    <p>Em ${UCP.desde} entrou em operação a ${esc(UCP.titulo)}, com ${UCP.leitos} leitos para pacientes que precisam de mais tempo de recuperação.</p>

    <h2>Atendimento pelo SUS</h2>
    <p>Parte do atendimento é feita em parceria com a Prefeitura de ${esc(CLINICA.cidade)}, dentro do Programa de Parceria na Assistência à Saúde do SUS. Nesses casos o acesso é pela rede municipal, com encaminhamento.</p>
    <p>A instituição também recebe recursos públicos por emendas parlamentares e apoio de empresas e entidades da cidade e da região.</p>

    <h2>Identificação</h2>
    <ul>
      <li>Razão social: ${esc(CLINICA.razaoSocial)}</li>
      <li>CNPJ: ${esc(CLINICA.cnpj)}</li>
      <li>Natureza jurídica: ${esc(CLINICA.naturezaJuridica)}</li>
      <li>Diretor técnico: ${ctx.dado(CLINICA.diretorTecnico, 'Diretor técnico')}</li>
      <li>Inscrição no conselho: ${ctx.dado(CLINICA.crmDiretorTecnico, 'CRM-SP do diretor técnico')}</li>
    </ul>
  </div>
</section>

<section class="secao secao-veu">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Formas de atendimento</span>
      <h2>Como o atendimento é pago</h2>
    </div>
    <div class="grade grade-3">
      ${ATENDIMENTO.map(a => `
      <div class="cartao">
        <h3>${esc(a.nome)}</h3>
        <p>${esc(a.sobre)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

${chamadaFinal(base, 'Para marcar uma consulta ou um exame, escolha o serviço e fale com a recepção.')}
`;

  return {
    p: {
      path: 'instituicao.html', base, titulo: 'A instituição',
      descricao: `O ${CLINICA.nome} é mantido pelo ${CLINICA.mantenedor}, associação sem fins lucrativos fundada em ${CLINICA.mantenedorDesde}. Atendimento em parceria com o SUS, por convênio e particular em ${CLINICA.cidade}.`
    },
    body,
    ld: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: CLINICA.mantenedor,
      foundingDate: String(CLINICA.mantenedorDesde),
      url: `${ctx.origem}/instituicao.html`,
      subOrganization: { '@type': 'MedicalClinic', name: CLINICA.nome }
    }
  };
}

/* ------------------------------------------------------------------ */
/* Agendamento                                                         */
/* ------------------------------------------------------------------ */

export function agendamento(ctx) {
  const base = '';

  /* O `id` de cada rótulo é o alvo dos links vindos da página inicial
     (agendamento.html#exame-imagem, por exemplo). O script lê o endereço ao
     carregar e já marca a opção correspondente, para quem clicou em "agendar
     um exame" não ter que escolher de novo. */
  const opcaoServico = (id, ancora, valor, rotulo, sub, canal, onde) => `
    <label class="opcao" id="${esc(ancora)}" for="serv-${id}">
      <input type="radio" name="servico" id="serv-${id}" value="${esc(valor)}"
        data-telefone="${esc(canal.telefone)}" data-e164="${esc(canal.e164)}" data-onde="${esc(onde)}"${id === 'consulta' ? ' checked' : ''}>
      <span>${esc(rotulo)}<small>${esc(sub)}</small></span>
    </label>`;

  const opcaoRadio = (nome, id, valor, rotulo, marcado = false) => `
    <label class="opcao" for="${id}">
      <input type="radio" name="${nome}" id="${id}" value="${esc(valor)}"${marcado ? ' checked' : ''}>
      <span>${esc(rotulo)}</span>
    </label>`;

  const canaisDiretos = CANAIS.map(c => `
    <div class="canal">
      <h3>${esc(c.titulo)}</h3>
      <p class="canal-onde">${ICO.local}<span>${esc(U[c.unidade].nome)}, número ${esc(U[c.unidade].numero)}</span></p>
      <p>${esc(c.descricao)}</p>
      <div class="canal-acoes">
        ${botao({ href: c.whatsappLink, texto: `WhatsApp ${c.whatsapp}`, tipo: 'zap', icone: ICO.whatsapp, externo: true })}
        ${botao({ href: `tel:+${c.e164}`, texto: `Ligar ${c.telefone}`, tipo: 'secundario', icone: ICO.telefone })}
      </div>
    </div>`).join('');

  const body = `
${cabecaPagina({
    base, migalha: 'Agendar',
    titulo: 'Agendar atendimento',
    entrada: 'Diga o que você precisa. O site monta a mensagem, mostra por inteiro e leva você ao telefone certo, com o número da rua já dentro.'
  })}

<section class="secao">
  <div class="env">
    <div class="grade grade-2">
      <form class="form-caixa" id="form-agendar" data-zap="${esc(CONTATO.whatsapp.e164)}" novalidate>
        <fieldset>
          <legend>1. Do que você precisa?</legend>
          <span class="campo-dica">Escolha uma opção. O telefone de cada serviço é diferente.</span>
          <div class="opcoes">
            ${opcaoServico('consulta', 'consulta', 'consulta', 'Uma consulta', 'Qualquer especialidade, no número 430', C.consultas, 'As consultas são no Centro Médico, no número 430 da Rua Dr. Joaquim de Abreu Sampaio Vidal.')}
            ${opcaoServico('exame', 'exame-imagem', 'exame', 'Um exame de imagem', 'Tomografia, ultrassom ou raio X, no número 340', C.exames, 'Os exames de imagem são no Diagnóstico por Imagem, no número 340 da Rua Dr. Joaquim de Abreu Sampaio Vidal.')}
            ${opcaoServico('oftalmo', 'oftalmologia', 'oftalmologia', 'Oftalmologia', 'Agenda e telefone próprios, no número 430', C.oftalmologia, 'A oftalmologia atende no Centro Médico, no número 430 da Rua Dr. Joaquim de Abreu Sampaio Vidal.')}
          </div>
          <p class="nota" id="aviso-onde" hidden></p>
        </fieldset>

        <div class="campo" id="bloco-especialidade">
          <label for="especialidade">2. Qual especialidade?</label>
          <span class="campo-dica">Se não souber, deixe em branco. A recepção orienta.</span>
          <select id="especialidade" name="especialidade">
            <option value="">Ainda não sei, preciso de orientação</option>
            ${ESPECIALIDADES.map(e => `<option value="${esc(e.nome)}">${esc(e.nome)}</option>`).join('')}
          </select>
        </div>

        <div class="campo" id="bloco-exame" hidden>
          <label for="tipo-exame">2. Qual exame?</label>
          <span class="campo-dica">Está escrito no pedido do médico. Se não souber, deixe em branco.</span>
          <select id="tipo-exame" name="tipo-exame">
            <option value="">Ainda não sei</option>
            ${EXAMES.map(e => `<option value="${esc(e.nome)}">${esc(e.nome)}</option>`).join('')}
          </select>
        </div>

        <fieldset>
          <legend>3. Como será o atendimento?</legend>
          <div class="opcoes opcoes-2">
            ${opcaoRadio('forma', 'forma-convenio', 'por convênio', 'Por convênio')}
            ${opcaoRadio('forma', 'forma-particular', 'particular', 'Particular')}
            ${opcaoRadio('forma', 'forma-sus', 'pelo SUS', 'Pelo SUS')}
            ${opcaoRadio('forma', 'forma-nsei', '', 'Ainda não sei', true)}
          </div>
        </fieldset>

        <fieldset>
          <legend>4. Melhor período para você</legend>
          <div class="opcoes opcoes-2">
            ${opcaoRadio('periodo', 'per-manha', 'de manhã', 'De manhã')}
            ${opcaoRadio('periodo', 'per-tarde', 'à tarde', 'À tarde')}
            ${opcaoRadio('periodo', 'per-qualquer', '', 'Tanto faz', true)}
          </div>
        </fieldset>

        <div class="campo">
          <label for="nome">5. Seu nome</label>
          <span class="campo-dica">Só o primeiro nome já ajuda. É opcional.</span>
          <input type="text" id="nome" name="nome" autocomplete="given-name" maxlength="80" spellcheck="false">
        </div>

        <div class="previa-msg">
          <h3>A mensagem que será aberta</h3>
          <p id="previa-mensagem">Escolha o que você precisa para ver a mensagem.</p>
        </div>

        <div class="canal-acoes">
          <a class="btn btn-zap btn-largo" id="btn-zap" href="https://wa.me/${esc(CONTATO.whatsapp.e164)}" target="_blank" rel="noopener noreferrer">${ICO.whatsapp}<span>Abrir no WhatsApp</span></a>
          <a class="btn btn-secundario btn-largo" id="btn-tel" href="tel:+${esc(C.consultas.e164)}">${ICO.telefone}<span id="rotulo-tel">Ligar ${esc(C.consultas.telefone)}</span></a>
        </div>

        <div class="nota">
          <p><b>Nada é enviado por este site.</b> O formulário escreve a mensagem no seu próprio aparelho e abre o seu WhatsApp com ela pronta. Você lê, muda o que quiser e decide se manda. Nenhum dado é guardado nem enviado para nós. <a href="${base}privacidade.html">Como tratamos isso</a>.</p>
        </div>
      </form>

      <div>
        <div class="cartao">
          <h3>Prefere ir direto?</h3>
          <p>Todos os telefones estão abaixo, por serviço. Eles funcionam mesmo se algo neste formulário não abrir no seu aparelho.</p>
        </div>
        <div class="grade" >
          ${canaisDiretos}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="secao secao-veu">
  <div class="env env-estreito">
    <div class="cabeca-secao">
      <span class="sobrenome">Perguntas</span>
      <h2>Antes de marcar</h2>
    </div>

    <details class="pergunta">
      <summary>Para qual endereço eu vou?</summary>
      <div class="pergunta-corpo">
        <p>Consultas, oftalmologia, coleta de sangue, cirurgia e internação ficam no <b>número 430</b>. Tomografia, ultrassonografia e radiografia ficam no <b>número 340</b>. Os dois na Rua Dr. Joaquim de Abreu Sampaio Vidal, no Alto Cafezal.</p>
        <p><a href="${base}unidades.html">Ver as duas unidades</a>.</p>
      </div>
    </details>

    <details class="pergunta">
      <summary>Preciso de pedido médico?</summary>
      <div class="pergunta-corpo">
        <p>Para exame, sim: é o pedido que diz qual exame fazer e qual preparo é necessário. Para consulta, não é obrigatório, mas se você já tem encaminhamento, leve.</p>
      </div>
    </details>

    <details class="pergunta">
      <summary>Atendem meu convênio?</summary>
      <div class="pergunta-corpo">
        <p>A clínica atende por convênio, por SUS e particular. A lista de planos aceitos: ${ctx.dado(null, 'Lista de convênios aceitos')}. Confirme a cobertura do seu plano ao marcar.</p>
      </div>
    </details>

    <details class="pergunta">
      <summary>Qual o horário de funcionamento?</summary>
      <div class="pergunta-corpo">
        <p>${ctx.dado(CLINICA.horarios, 'Horário de funcionamento')}</p>
      </div>
    </details>

    <details class="pergunta">
      <summary>E se for uma emergência?</summary>
      <div class="pergunta-corpo">
        <p>Não use este site nem espere resposta de mensagem. Procure o serviço de urgência mais próximo ou ligue para o SAMU, no <a href="tel:192">192</a>.</p>
      </div>
    </details>
  </div>
</section>
`;

  return {
    p: {
      path: 'agendamento.html', base, titulo: 'Agendar',
      descricao: `Agende consulta, exame de imagem ou oftalmologia no ${CLINICA.nome}, em ${CLINICA.cidade}. Escolha o serviço e fale pelo WhatsApp ou telefone, já com o endereço certo da unidade.`
    },
    body,
    ld: null
  };
}

/* ------------------------------------------------------------------ */
/* Contato                                                             */
/* ------------------------------------------------------------------ */

export function contato(ctx) {
  const base = '';

  const canais = CANAIS.map(c => `
    <div class="canal">
      <h3>${esc(c.titulo)}</h3>
      <p class="canal-onde">${ICO.local}<span>${esc(U[c.unidade].nome)}, número ${esc(U[c.unidade].numero)}</span></p>
      <p>${esc(c.descricao)}</p>
      <div class="canal-acoes">
        ${botao({ href: c.whatsappLink, texto: `WhatsApp ${c.whatsapp}`, tipo: 'zap', icone: ICO.whatsapp, externo: true })}
        ${botao({ href: `tel:+${c.e164}`, texto: `Ligar ${c.telefone}`, tipo: 'secundario', icone: ICO.telefone })}
      </div>
    </div>`).join('');

  const body = `
${cabecaPagina({
    base, migalha: 'Contato',
    titulo: 'Contato',
    entrada: 'Cada serviço tem seu telefone. Escolha pelo que você precisa e você chega direto em quem resolve.'
  })}

<section class="secao">
  <div class="env">
    <div class="grade grade-3">${canais}</div>

    <div class="nota">
      <p><b>Um número de WhatsApp para tudo.</b> O WhatsApp é o mesmo em todos os serviços, ${esc(CONTATO.whatsapp.numero)}. A mensagem já sai dizendo do que se trata, para a recepção encaminhar sem você ter que explicar duas vezes.</p>
    </div>
  </div>
</section>

<section class="secao secao-veu">
  <div class="env">
    <div class="cabeca-secao">
      <span class="sobrenome">Endereços</span>
      <h2>Onde estamos</h2>
    </div>
    ${UNIDADES.map(u => blocoUnidade(u, base)).join('')}
  </div>
</section>

<section class="secao">
  <div class="env env-estreito prosa">
    <h2>Outros assuntos</h2>
    <p>Para segunda via de documento, nota fiscal, prontuário ou assunto do setor financeiro, ligue para o telefone de consultas, <a href="tel:+${esc(C.consultas.e164)}">${esc(C.consultas.telefone)}</a>, e peça para ser encaminhado ao setor responsável.</p>
    <p>E-mail de atendimento: ${ctx.dado(CLINICA.email, 'E-mail de atendimento')}</p>
    <p>Horário de funcionamento: ${ctx.dado(CLINICA.horarios, 'Horário de funcionamento')}</p>

    <div class="aviso">
      ${ICO.alerta}
      <div>
        <p><b>Emergência não se resolve por mensagem.</b> Procure o serviço de urgência mais próximo ou ligue para o SAMU, no <a href="tel:192">192</a>.</p>
      </div>
    </div>
  </div>
</section>
`;

  return {
    p: {
      path: 'contato.html', base, titulo: 'Contato',
      descricao: `Telefones e endereços do ${CLINICA.nome} em ${CLINICA.cidade}: consultas ${C.consultas.telefone}, exames ${C.exames.telefone}, oftalmologia ${C.oftalmologia.telefone} e WhatsApp ${CONTATO.whatsapp.numero}.`
    },
    body,
    ld: ldOrganizacao(ctx.origem)
  };
}

/* ------------------------------------------------------------------ */
/* Privacidade                                                         */
/* ------------------------------------------------------------------ */

export function privacidade(ctx) {
  const base = '';

  const body = `
${cabecaPagina({
    base, migalha: 'Privacidade',
    titulo: 'Privacidade',
    entrada: 'Este site foi feito para não coletar nada. Esta página explica o que isso quer dizer, na prática, e o que acontece quando você usa o agendamento.'
  })}

<section class="secao">
  <div class="env env-estreito prosa">
    <h2>O que este site não faz</h2>
    <ul>
      <li>Não usa cookies.</li>
      <li>Não tem ferramenta de medição de audiência nem de publicidade.</li>
      <li>Não carrega nada de outros sites: nem fonte, nem mapa embutido, nem botão de rede social. Tudo o que a página usa está no próprio servidor dela.</li>
      <li>Não guarda o que você digita.</li>
      <li>Não envia formulário para servidor nenhum.</li>
    </ul>
    <p>Isso não é só uma promessa de texto. A página declara uma política de segurança de conteúdo com <b>connect-src 'none'</b> e <b>form-action 'none'</b>, o que faz o próprio navegador bloquear qualquer tentativa de enviar dados. Dá para conferir nas ferramentas de desenvolvedor do seu navegador.</p>

    <h2>O agendamento</h2>
    <p>O formulário da página de agendamento monta uma frase com o que você escolheu e a coloca dentro de um link do WhatsApp. Todo esse processamento acontece no seu próprio aparelho.</p>
    <p>A mensagem aparece inteira na tela antes de qualquer coisa. Se você tocar em "Abrir no WhatsApp", o seu aplicativo abre com a mensagem escrita e você decide se manda, se muda ou se desiste. Nada sai daqui sem essa decisão.</p>
    <p>A partir do momento em que você envia a mensagem, a conversa passa a acontecer no WhatsApp, entre você e a clínica, sob as regras de privacidade desse aplicativo.</p>

    <h2>Por que pedimos tão pouco</h2>
    <p>O formulário pede o mínimo para a recepção conseguir encaminhar: o serviço, a especialidade ou o exame, a forma de atendimento, o período e, se você quiser, o seu nome.</p>
    <p>Não pedimos documento, endereço, data de nascimento, número de carteirinha nem descrição de sintoma. Essas informações são de saúde ou pessoais, têm proteção reforçada na Lei Geral de Proteção de Dados, e não fazem falta para marcar um horário. Elas devem ser dadas ao atendimento, no canal apropriado.</p>

    <h2>Dados tratados pela clínica</h2>
    <p>Quando você fala com a clínica por telefone ou WhatsApp, ou quando é atendido, a instituição trata dados seus para prestar o serviço de saúde e cumprir obrigações legais, como o prontuário.</p>
    <p>Esse tratamento é feito pelo ${esc(CLINICA.razaoSocial)}, CNPJ ${esc(CLINICA.cnpj)}, e não por este site. Para pedidos de acesso, correção ou exclusão de dados, fale pelos canais da página de <a href="${base}contato.html">contato</a>.</p>
    <p>Encarregado pelo tratamento de dados: ${ctx.dado(null, 'Encarregado de dados (LGPD)')}</p>

    <h2>Conteúdo do site</h2>
    <p>As informações publicadas aqui são gerais e servem para orientar quem procura atendimento. Elas não substituem a consulta médica e não devem ser usadas para decidir tratamento por conta própria.</p>
  </div>
</section>
`;

  return {
    p: {
      path: 'privacidade.html', base, titulo: 'Privacidade',
      descricao: `Como o site do ${CLINICA.nome} trata dados: sem cookies, sem medição de audiência, sem envio de formulário. O agendamento monta a mensagem no seu aparelho e abre o seu WhatsApp.`
    },
    body,
    ld: null
  };
}

/* ------------------------------------------------------------------ */
/* 404                                                                 */
/* ------------------------------------------------------------------ */

export function naoEncontrada(ctx) {
  const base = '';

  const body = `
<section class="secao">
  <div class="env env-estreito prosa">
    <h1>Esta página não existe</h1>
    <p class="entrada">O endereço que você abriu não corresponde a nenhuma página do site. Pode ter sido um link antigo ou um erro de digitação.</p>
    <h2>Para onde você queria ir?</h2>
    <ul>
      <li><a href="${base}index.html">Página inicial</a></li>
      <li><a href="${base}agendamento.html">Agendar consulta ou exame</a></li>
      <li><a href="${base}especialidades.html">Especialidades</a></li>
      <li><a href="${base}exames.html">Exames</a></li>
      <li><a href="${base}unidades.html">Endereços das unidades</a></li>
      <li><a href="${base}contato.html">Telefones</a></li>
    </ul>
    <div class="grupo-botoes">
      ${botao({ href: `${base}index.html`, texto: 'Ir para o início', tipo: 'principal', icone: ICO.seta })}
      ${botao({ href: C.consultas.whatsappLink, texto: 'Falar no WhatsApp', tipo: 'zap', icone: ICO.whatsapp, externo: true })}
    </div>
  </div>
</section>
`;

  return {
    p: {
      path: '404.html', base, titulo: 'Página não encontrada',
      descricao: `A página procurada não existe no site do ${CLINICA.nome}. Veja os caminhos para agendamento, especialidades, exames, unidades e telefones da clínica em ${CLINICA.cidade}.`
    },
    body,
    ld: null
  };
}
