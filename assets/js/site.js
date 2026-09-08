/* =========================================================================
   Comportamento do site. Duas coisas, só.

   1. Abrir e fechar o menu no celular.
   2. Montar a mensagem de agendamento.

   SOBRE O AGENDAMENTO, E ISTO IMPORTA
   O formulário não envia nada para lugar nenhum. Não existe servidor, não
   existe requisição, não existe armazenamento: o site é HTML estático. O que
   o script faz é escrever uma frase e colocá-la num link do WhatsApp ou do
   telefone. A pessoa vê a frase inteira antes, abre o próprio WhatsApp e
   decide se manda. A CSP do site tem `connect-src 'none'` e
   `form-action 'none'`, o que torna isso verificável e não apenas prometido.

   MELHORIA PROGRESSIVA
   Sem JavaScript o formulário continua servindo: os telefones e o WhatsApp
   de cada serviço estão escritos na página, como links diretos, na seção
   "Prefere ir direto". Nada aqui é a única forma de agendar.
   ========================================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- */
  /* Menu do celular                                                   */
  /* ---------------------------------------------------------------- */

  var botao = document.getElementById('abrir-menu');
  var nav = document.getElementById('navegacao');

  if (botao && nav) {
    botao.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });

    /* Voltar ao estado fechado quando a tela cresce, para o menu não ficar
       preso aberto ao girar o aparelho. */
    var largura = window.matchMedia('(min-width: 901px)');
    var aoMudar = function (ev) {
      if (ev.matches) {
        nav.classList.remove('aberto');
        botao.setAttribute('aria-expanded', 'false');
      }
    };
    if (largura.addEventListener) { largura.addEventListener('change', aoMudar); }
    else if (largura.addListener) { largura.addListener(aoMudar); }

    /* Aberto, o menu empurra o cabeçalho grudento para perto de 400 px de
       altura e passa a cobrir o começo do conteúdo. Fechar no Escape e ao
       sair do cabeçalho evita isso e evita foco escondido atrás do menu. */
    var fechar = function () {
      if (!nav.classList.contains('aberto')) { return; }
      nav.classList.remove('aberto');
      botao.setAttribute('aria-expanded', 'false');
    };
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { fechar(); botao.focus(); }
    });
    var topo = botao.closest('header');
    if (topo) {
      topo.addEventListener('focusout', function (ev) {
        if (!topo.contains(ev.relatedTarget)) { fechar(); }
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Agendamento                                                       */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('form-agendar');
  if (!form) { return; }

  var zap = form.getAttribute('data-zap');
  var previa = document.getElementById('previa-mensagem');
  var btnZap = document.getElementById('btn-zap');
  var btnTel = document.getElementById('btn-tel');
  var rotuloTel = document.getElementById('rotulo-tel');
  var blocoEsp = document.getElementById('bloco-especialidade');
  var blocoExame = document.getElementById('bloco-exame');
  var selEsp = document.getElementById('especialidade');
  var selExame = document.getElementById('tipo-exame');
  var campoNome = document.getElementById('nome');
  var avisoOnde = document.getElementById('aviso-onde');

  var marcado = function (nome) {
    return form.querySelector('input[name="' + nome + '"]:checked');
  };

  var limpa = function (t) {
    /* Some com quebras de linha e aperta espaços. Nada além disso entra na
       mensagem: o campo de nome é o único texto livre do formulário. */
    return String(t || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  };

  function montar() {
    var servico = marcado('servico');
    if (!servico) { return null; }

    var tipo = servico.value;
    var partes = [];
    var nome = limpa(campoNome && campoNome.value);

    partes.push('Olá! Falo com o Centro Médico Aconchego?');

    if (tipo === 'consulta') {
      var esp = selEsp && selEsp.value;
      partes.push(esp
        ? 'Gostaria de marcar uma consulta de ' + esp + '.'
        : 'Gostaria de marcar uma consulta. Ainda não sei a especialidade e preciso de orientação.');
    } else if (tipo === 'exame') {
      var ex = selExame && selExame.value;
      partes.push(ex
        ? 'Gostaria de agendar um exame de ' + ex + '.'
        : 'Gostaria de agendar um exame de imagem.');
    } else if (tipo === 'laboratorio') {
      partes.push('Gostaria de agendar coleta de sangue ou exame de laboratório.');
    } else {
      partes.push('Gostaria de marcar um atendimento de oftalmologia.');
    }

    var forma = marcado('forma');
    if (forma && forma.value) { partes.push('Seria ' + forma.value + '.'); }

    var periodo = marcado('periodo');
    if (periodo && periodo.value) { partes.push('O melhor período para mim é ' + periodo.value + '.'); }

    if (nome) { partes.push('Meu nome é ' + nome + '.'); }

    /* O numero da rua entra na mensagem, e nao so na tela. Dois motivos: a
       pessoa fica com ele guardado no proprio historico do WhatsApp, e a
       recepcao e' obrigada a confirmar, que e' justamente o passo que hoje
       nao acontece e faz gente ir ao predio errado. */
    var numero = servico.getAttribute('data-numero');
    if (numero) {
      partes.push('Entendi que é no número ' + numero + ' da Rua Dr. Joaquim de Abreu Sampaio Vidal. Confirma para mim, por favor?');
    }

    return partes.join(' ');
  }

  /* Cada opção de serviço carrega o telefone certo nos próprios atributos,
     para o botão de ligar mudar junto e a pessoa nunca discar o número de
     outro setor. */
  function atualizar() {
    var servico = marcado('servico');
    var msg = montar();

    if (blocoEsp) { blocoEsp.hidden = !servico || servico.value !== 'consulta'; }
    if (blocoExame) { blocoExame.hidden = !servico || servico.value !== 'exame'; }

    if (avisoOnde && servico) {
      avisoOnde.textContent = servico.getAttribute('data-onde') || '';
      avisoOnde.hidden = false;
    }

    if (previa) {
      previa.textContent = msg || 'Escolha o que você precisa para ver a mensagem.';
    }

    if (btnZap) {
      if (msg) {
        btnZap.href = 'https://wa.me/' + zap + '?text=' + encodeURIComponent(msg);
      } else {
        btnZap.href = 'https://wa.me/' + zap;
      }
    }

    if (btnTel && servico) {
      var e164 = servico.getAttribute('data-e164');
      var exibicao = servico.getAttribute('data-telefone');
      if (e164) { btnTel.href = 'tel:+' + e164; }
      if (rotuloTel && exibicao) { rotuloTel.textContent = 'Ligar ' + exibicao; }
    }
  }

  form.addEventListener('change', atualizar);
  form.addEventListener('input', atualizar);

  /* Sem servidor não há para onde enviar. A CSP já bloqueia com
     `form-action 'none'`; isto aqui é a segunda tranca, para o navegador nem
     tentar e nunca colocar o que a pessoa digitou na barra de endereço. */
  form.addEventListener('submit', function (ev) { ev.preventDefault(); });

  /* Quem chegou de "agendar um exame" na página inicial já encontra a opção
     marcada, em vez de ter que escolher duas vezes. */
  function aplicarEndereco() {
    var alvo = (window.location.hash || '').replace('#', '');
    var mapa = { consulta: 'serv-consulta', 'exame-imagem': 'serv-exame', laboratorio: 'serv-laboratorio', oftalmologia: 'serv-oftalmo' };
    var id = mapa[alvo];
    if (!id) { return; }
    var radio = document.getElementById(id);
    if (radio && !radio.checked) { radio.checked = true; }
  }

  aplicarEndereco();
  window.addEventListener('hashchange', function () { aplicarEndereco(); atualizar(); });

  atualizar();
}());
