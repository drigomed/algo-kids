# Missões do Robô — Pequenos Programadores

MVP V0.1 jogável de programação sequencial, em português do Brasil. Monte o programa antes de executar e leve o robô até a estrela.

## Executar

Requisitos: Node.js 22+ para testes/build e Python 3 para o servidor local. Sem dependências a instalar.

```sh
npm run dev
```

Abra http://localhost:5173. ES modules precisam de servidor HTTP; abrir index.html diretamente não é suportado.

```sh
npm test
npm run build
```

O build gera `dist/`, pronto para hospedagem estática. Nenhum deploy foi realizado.

## Jogar

Escolha uma das seis missões. Toque em Avançar, Virar à esquerda ou Virar à direita para adicionar comandos. As setas da lista reordenam; × remove. Executar começa do início; Pausar/Continuar controla a execução; Passo a passo executa um comando. Reiniciar mantém o programa; Limpar apaga os comandos. Alterar um programa pausado reinicia a posição do robô. A direção inicial aparece pela seta sobre o robô; norte fica no topo.

## Estrutura

- `src/engine.js`: motor puro, estados, validação e simulação determinística.
- `src/missions.js`: seis missões progressivas, dicas e soluções de referência.
- `src/ui.js`: editor, execução temporizada e renderização.
- `src/style.css`: layout responsivo, controles de toque e movimento reduzido.
- `tests/engine.test.js`: movimento, rotações, colisões, vitória, determinismo e soluções das seis missões.
- `scripts/build.js`: empacotamento estático sem dependências.
- `docs/`: especificação original de produto, escopo e roadmap.

Sem backend, APIs, fontes externas, anúncios, contas, telemetria ou dados pessoais. Progresso fica apenas na memória da página e reinicia ao recarregar. Os comandos são nós tipados; não há execução de código arbitrário.

## Validação e limites

Testes automatizados do motor e build executados. A interface ainda precisa de validação visual em navegadores reais e de uma sessão acompanhada por adulto para confirmar legibilidade, orientação e dificuldade. Não há testes automatizados de navegador ou captura de tela nesta entrega. Loops, decisões, som, PWA e persistência ficam para versões posteriores.
