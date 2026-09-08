/* =========================================================================
   FONTE ÚNICA DE VERDADE do site do Centro Médico Aconchego.

   Nada de conteúdo factual é escrito direto no HTML: tudo sai daqui. Para
   corrigir um telefone, um endereço ou uma especialidade, mexa neste arquivo
   e rode `node build.mjs --preview` de novo.

   REGRA DOS CAMPOS `null`
   Campo com valor `null` é dado que ninguém confirmou com a clínica. Na
   prévia ele vira uma marcação visível "a confirmar"; na build de produção
   ele derruba o processo. É de propósito: melhor um site que não publica do
   que um site que publica horário errado de uma clínica.

   PROCEDÊNCIA
   Cada bloco traz de onde veio o dado. `[linktree]` é canal do próprio
   negócio e, onde houver conflito, vence registro público de terceiro.
   O detalhamento está em interno/NOTAS-INTERNAS.md.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. Identidade
   ------------------------------------------------------------------------- */

export const CLINICA = {
  /* Nome de exibição. Escolhido de propósito entre as oito variantes que
     circulam: é o que está no Google Maps e no site do mantenedor, e é o
     que a pessoa digita quando procura. Ver NOTAS-INTERNAS, "arquitetura
     de marca". */
  nome: 'Centro Médico Aconchego',
  nomeCurto: 'Aconchego',
  assinatura: 'Centro Médico e Diagnóstico',
  cidade: 'Marília',
  uf: 'SP',

  /* Mantenedor. O Aconchego é filial de uma associação sem fins lucrativos,
     não empresa própria. `[receita]` `[econodata]` */
  mantenedor: 'Hospital Espírita de Marília',
  mantenedorSigla: 'HEM',
  mantenedorDesde: 1948,
  inauguracao: 2017,
  cnpj: '52.050.010/0002-16',
  razaoSocial: 'Hospital Espírita de Marília',
  naturezaJuridica: 'Associação privada sem fins lucrativos',

  /* Domínio de publicação. Enquanto o negócio não tiver domínio próprio, a
     prévia vive no GitHub Pages. Trocar por https://www.aconchego.org.br (ou
     o que a diretoria decidir) antes da build de produção. */
  origem: 'https://filipejefte.github.io/centro-medico-aconchego',

  /* Identificação obrigatória em publicidade de estabelecimento de saúde
     (Resolução CFM 2.336/2023). NÃO INVENTAR: pedir à diretoria. */
  diretorTecnico: null,
  crmDiretorTecnico: null,

  /* Nenhum e-mail comercial foi localizado em nenhuma superfície pública. O
     único publicado como contato da clínica é o da contabilidade, que não
     serve para paciente. Pedir um e-mail de atendimento. */
  email: null,

  /* Horário de funcionamento não consta de nenhuma fonte pública. */
  horarios: null
};

/* -------------------------------------------------------------------------
   2. Unidades

   O achado que mais muda a experiência do paciente: são DUAS unidades, em
   números diferentes da mesma rua, e a segunda não existe em nenhum mapa.
   Por isso todo endereço no site aparece por extenso, com o número em
   destaque, e o link de mapa é por BUSCA DE ENDEREÇO, nunca por ponto
   salvo. Ver NOTAS-INTERNAS, "por que os mapas são por endereço".
   ------------------------------------------------------------------------- */

const mapa = (endereco) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(endereco);

export const UNIDADES = [
  {
    id: 'centro-medico',
    nome: 'Centro Médico',
    resumo: 'Consultas nas especialidades, pequenas cirurgias e internação.',
    numero: '430',
    logradouro: 'R. Dr. Joaquim de Abreu Sampaio Vidal',
    bairro: 'Alto Cafezal',
    cidade: 'Marília',
    uf: 'SP',
    cep: '17504-072',
    get enderecoCompleto() {
      return `${this.logradouro}, ${this.numero}, ${this.bairro}, ${this.cidade} ${this.uf}, ${this.cep}`;
    },
    get mapa() { return mapa(this.enderecoCompleto); },
    atendeAqui: [
      'Consultas nas especialidades',
      'Oftalmologia',
      'Pequenas cirurgias e cirurgias de média complexidade',
      'Enfermaria 24 horas e internação',
      'Laboratório de análises clínicas'
    ]
  },
  {
    id: 'diagnostico-por-imagem',
    nome: 'Diagnóstico por Imagem',
    resumo: 'Exames de imagem. Fica na mesma rua do Centro Médico, em outro prédio.',
    numero: '340',
    logradouro: 'R. Dr. Joaquim de Abreu Sampaio Vidal',
    bairro: 'Alto Cafezal',
    cidade: 'Marília',
    uf: 'SP',
    cep: '17506-130',
    get enderecoCompleto() {
      return `${this.logradouro}, ${this.numero}, ${this.bairro}, ${this.cidade} ${this.uf}, ${this.cep}`;
    },
    get mapa() { return mapa(this.enderecoCompleto); },
    atendeAqui: [
      'Tomografia',
      'Ultrassonografia',
      'Radiografia'
    ]
  }
];

/* -------------------------------------------------------------------------
   3. Canais de contato

   DECISÃO TÉCNICA IMPORTANTE, e ela é deliberada.

   O Linktree do negócio publica um link de WhatsApp para o número
   (14) 2105-1477, que é LINHA FIXA. O link de consultas, por comparação,
   usa corretamente um celular. WhatsApp em linha fixa existe, mas exige
   verificação específica da linha, e ninguém confirmou que essa foi feita.

   Enquanto isso não for testado, o site NÃO manda ninguém para esse
   WhatsApp. Todo botão de WhatsApp aponta para o celular verificado
   (14) 99123-4736, com uma mensagem pronta que já diz do que se trata, para
   a recepção saber para onde encaminhar. Os fixos continuam publicados como
   telefone de ligação, que é o que eles comprovadamente são.

   Se a clínica confirmar que o fixo tem WhatsApp ativo, basta trocar
   `whatsapp` no canal de exames. O resto do site se ajusta sozinho.
   ------------------------------------------------------------------------- */

/* Celular verificado, único número usado para WhatsApp no site inteiro. */
const WHATSAPP = { numero: '(14) 99123-4736', e164: '5514991234736' };

const zap = (texto) =>
  `https://wa.me/${WHATSAPP.e164}?text=${encodeURIComponent(texto)}`;

export const CANAIS = [
  {
    id: 'consultas',
    titulo: 'Consultas',
    descricao: 'Marcar, remarcar ou tirar dúvida sobre uma consulta em qualquer especialidade.',
    telefone: '(14) 2105-1466',
    e164: '551421051466',
    whatsapp: WHATSAPP.numero,
    whatsappLink: zap('Olá! Gostaria de marcar uma consulta no Centro Médico Aconchego.'),
    unidade: 'centro-medico'
  },
  {
    id: 'exames',
    titulo: 'Exames de imagem',
    descricao: 'Tomografia, ultrassonografia e radiografia.',
    telefone: '(14) 2105-1477',
    e164: '551421051477',
    whatsapp: WHATSAPP.numero,
    whatsappLink: zap('Olá! Gostaria de agendar um exame de imagem no Centro Médico Aconchego.'),
    unidade: 'diagnostico-por-imagem'
  },
  {
    id: 'oftalmologia',
    titulo: 'Oftalmologia',
    descricao: 'Consultas e exames de olhos, com atendimento e telefone próprios.',
    telefone: '(14) 2105-1499',
    e164: '551421051499',
    whatsapp: WHATSAPP.numero,
    whatsappLink: zap('Olá! Gostaria de marcar um atendimento de oftalmologia no Centro Médico Aconchego.'),
    unidade: 'centro-medico'
  }
];

export const CONTATO = { whatsapp: WHATSAPP, zap };

/* -------------------------------------------------------------------------
   4. Especialidades

   Lista lida da página do Aconchego no site do mantenedor. Cada item tem só
   o que dá para afirmar com honestidade: o que a especialidade cuida, em
   linguagem de paciente. Nada de conduta clínica, nada de promessa.

   `unidade` diz para onde a pessoa vai. É a informação que hoje não existe
   em lugar nenhum e que faz o paciente errar de prédio.
   ------------------------------------------------------------------------- */

export const ESPECIALIDADES = [
  { slug: 'clinica-medica', nome: 'Clínica Médica', sobre: 'É a consulta por onde começar quando a queixa é geral. Acompanha doença crônica e encaminha para a área certa.' },
  { slug: 'cardiologia', nome: 'Cardiologia', sobre: 'Acompanhamento do coração e da pressão, avaliação antes de cirurgias e seguimento de quem já trata do coração.' },
  { slug: 'cirurgia-vascular', nome: 'Cirurgia Vascular', sobre: 'Cuidado das veias e artérias, incluindo varizes, feridas que não fecham e circulação das pernas.' },
  { slug: 'dermatologia', nome: 'Dermatologia', sobre: 'Pele, cabelos e unhas: manchas, lesões, alergias e acompanhamento de sinais.' },
  { slug: 'geriatria', nome: 'Geriatria', sobre: 'Atendimento pensado para a pessoa idosa, com atenção a quedas, memória, sono e uso de vários remédios ao mesmo tempo.' },
  { slug: 'ginecologia', nome: 'Ginecologia', sobre: 'Saúde da mulher em todas as fases, do exame preventivo à menopausa.' },
  /* Não escrever "até o parto": nenhuma fonte pública confirma que a clínica
     realiza partos, e prometer isso mandaria gestante para o lugar errado. */
  { slug: 'obstetricia', nome: 'Obstetrícia', sobre: 'Consultas de pré-natal e acompanhamento da gestação.' },
  { slug: 'oftalmologia', nome: 'Oftalmologia', sobre: 'Consultas e exames de olhos. Tem agenda e telefone próprios.', telefone: '(14) 2105-1499' },
  { slug: 'oncologia', nome: 'Oncologia', sobre: 'Consulta e acompanhamento de quem está em tratamento de câncer, junto com a equipe que conduz o caso.' },
  { slug: 'ortopedia', nome: 'Ortopedia', sobre: 'Cuida de fratura, dor nas costas, joelho e ombro, e da recuperação depois de uma lesão ou de uma cirurgia.' },
  { slug: 'pediatria', nome: 'Pediatria', sobre: 'Acompanhamento de crianças e adolescentes, do crescimento às queixas do dia a dia.' },
  { slug: 'urologia', nome: 'Urologia', sobre: 'Cuida dos rins, da bexiga e da próstata, e do que atrapalha o funcionamento urinário em homens e mulheres.' },
  { slug: 'psiquiatria', nome: 'Psiquiatria', sobre: 'Acompanhamento em saúde mental, com consulta e seguimento ao longo do tratamento.' },
  { slug: 'psicologia', nome: 'Psicologia', sobre: 'Conversas individuais com psicólogo, em sessões marcadas, para tratar ansiedade, luto e outras questões de saúde mental.' },
  { slug: 'nutricao', nome: 'Nutrição', sobre: 'Orientação alimentar para acompanhar tratamentos e condições de saúde.' },
  { slug: 'fisioterapia', nome: 'Fisioterapia', sobre: 'Reabilitação de movimento, força e equilíbrio, inclusive depois de cirurgia ou internação.' }
];

/* -------------------------------------------------------------------------
   5. Exames
   ------------------------------------------------------------------------- */

export const EXAMES = [
  { nome: 'Tomografia', unidade: 'diagnostico-por-imagem', sobre: 'Imagem detalhada em camadas, pedida para investigar o que a radiografia não mostra.' },
  { nome: 'Ultrassonografia', unidade: 'diagnostico-por-imagem', sobre: 'Exame por ondas de som, sem radiação, usado do abdome à gestação.' },
  { nome: 'Radiografia', unidade: 'diagnostico-por-imagem', sobre: 'O raio X de sempre, para ossos, tórax e avaliações rápidas.' },
  { nome: 'Análises clínicas', unidade: 'centro-medico', sobre: 'Exames de sangue e demais análises, coletados no próprio Centro Médico.' }
];

/* O que levar. Universal e verificável: nada aqui é orientação clínica. O
   preparo específico de cada exame é dado no agendamento, por quem sabe qual
   exame foi pedido. */
export const LEVAR = [
  'Documento com foto',
  'Cartão do convênio, quando for o caso',
  'O pedido do médico',
  'Exames anteriores do mesmo tipo, se você tiver'
];

/* -------------------------------------------------------------------------
   6. Estrutura
   ------------------------------------------------------------------------- */

export const ESTRUTURA = [
  { nome: 'Nove consultórios', sobre: 'Consultas marcadas com hora, nas áreas de atendimento, em consultórios próprios do Centro Médico.' },
  { nome: 'Centro cirúrgico com duas salas', sobre: 'Cirurgias de pequena e média complexidade, com internação no próprio prédio.' },
  { nome: 'Enfermaria 24 horas', sobre: 'Leitos com enfermagem a qualquer hora, para quem precisa ficar internado ou em observação.' },
  /* NÃO escrever aqui "primeiro atendimento de casos graves". O CNAE da
     filial é 86.10-1/01, atendimento hospitalar EXCETO pronto-socorro, e a
     sala de estabilização aparece na fonte só como parte da UCP. Quem lê
     "emergência" com dor no peito dirige até aqui em vez de chamar o SAMU. */
  { nome: 'Sala de estabilização', sobre: 'Estrutura para atender intercorrência de quem já está em atendimento ou internado na unidade, enquanto o caso é avaliado e encaminhado.' },
  { nome: 'Unidade de Cuidados Prolongados', sobre: 'Quinze leitos para quem precisa de mais tempo de recuperação depois de uma cirurgia ou de uma internação longa.' },
  { nome: 'Laboratório e imagem', sobre: 'Análises clínicas no Centro Médico e exames de imagem na unidade da mesma rua.' }
];

export const UCP = {
  titulo: 'Unidade de Cuidados Prolongados',
  desde: 2024,
  leitos: 15,
  permanencia: 'até 90 dias',
  equipe: ['Acompanhamento médico', 'Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Assistência social']
};

/* -------------------------------------------------------------------------
   7. Formas de atendimento
   ------------------------------------------------------------------------- */

export const ATENDIMENTO = [
  /* NÃO escrever aqui "com encaminhamento da rede municipal": esse mecanismo
     de acesso foi inferido, não consta de nenhuma fonte, e mandar paciente do
     SUS buscar na UBS um encaminhamento que talvez não seja o caminho custa
     dias a ele. O contrato que sustenta a parceria (CV-1200/21) vence em
     22/09/2026: confirmar a renovação antes de publicar em produção. */
  { nome: 'SUS', sobre: 'Parte do atendimento é feita em parceria com a Prefeitura de Marília, pelo Sistema Único de Saúde. Confirme com a recepção como é o acesso hoje.' },
  { nome: 'Convênios', sobre: 'A clínica atende por convênio. Confirme a cobertura do seu plano no momento de marcar.' },
  { nome: 'Particular', sobre: 'Dá para marcar consulta ou exame sem convênio. O valor depende da área e do exame, e quem atende no telefone informa antes de você fechar o horário.' }
];

/* Lista de convênios aceitos: nenhuma fonte pública traz. Pedir à clínica. */
export const CONVENIOS = null;

/* -------------------------------------------------------------------------
   8. Navegação
   ------------------------------------------------------------------------- */

/* "Contato" entra no menu de propósito. O botão "Agendar" não substitui:
   quem liga por causa de uma nota fiscal ou de um resultado não clica em
   agendar, procura a palavra contato. "A instituição" desce para o rodapé,
   porque é conteúdo de confiança e não de tarefa. */
export const MENU = [
  { path: 'index.html', rotulo: 'Início' },
  { path: 'especialidades.html', rotulo: 'Especialidades' },
  { path: 'exames.html', rotulo: 'Exames' },
  { path: 'estrutura.html', rotulo: 'Estrutura' },
  { path: 'unidades.html', rotulo: 'Unidades' },
  { path: 'contato.html', rotulo: 'Contato' }
];
