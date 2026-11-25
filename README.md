# 🔎 Projeto Secreto — Uma missão inesperada

Um site-jogo de mistério feito para ser aberto no **celular**, a partir de um link no WhatsApp.
A Bia percorre cinco fases com enigmas e pistas, guiada por gatinhos animados, e no final descobre que a missão era um convite para sair. Os botões finais abrem o WhatsApp com uma mensagem já escrita, e ela decide se envia ou não.

## Tecnologias

- HTML5, CSS3 e JavaScript puro (sem frameworks, sem build, sem Node)
- Fontes Fredoka e Nunito pelo Google Fonts (com alternativas de sistema se não carregarem)
- Música e sons gerados pelo próprio navegador (Web Audio): não precisa de nenhum arquivo de áudio
- Sem anúncios, sem rastreamento, sem coleta de dados. O progresso fica só no `sessionStorage` da aba.

## Estrutura dos arquivos

```
projeto-secreto/
├── index.html            Todas as telas (início + 5 fases)
├── css/
│   ├── style.css         Visual, cores, componentes
│   ├── animations.css    Animações (respeita "reduzir movimento")
│   └── responsive.css    Ajustes para telas pequenas, tablets e computador
├── js/
│   ├── whatsapp.js       Número e mensagens do WhatsApp   ← você edita aqui
│   ├── effects.js        Confete, estrelas, avisos e efeitos sonoros
│   ├── music.js          Música de fundo suave
│   ├── cats.js           Gatinhos animados e balões de fala
│   ├── puzzles.js        Textos, respostas e lógica dos enigmas
│   ├── navigation.js     Troca de telas com transição
│   └── game.js           Progresso, botões, reiniciar, easter eggs
├── assets/
│   ├── images/
│   ├── icons/            favicon.svg
│   └── sounds/           (opcional) seus arquivos de áudio
└── README.md
```

## Como configurar o número do WhatsApp

1. Abra `js/whatsapp.js`.
2. Troque o valor de `WHATSAPP_NUMBER`:

   ```js
   const WHATSAPP_NUMBER = "5511999998888";
   ```

3. Use **só números**, no formato **55 + DDD + número** (sem `+`, espaços, parênteses ou traços).
   Exemplo: DDD 11, número 99999-8888 → `5511999998888`.

Se esquecer de trocar, os botões do final mostram um aviso em vez de abrir um link quebrado.

## Como alterar as mensagens

- **Mensagens do WhatsApp:** `js/whatsapp.js`, no objeto `MESSAGES` (`accept` e `more`).
- **Respostas, dicas, erros e falas dos gatinhos:** `js/puzzles.js`, no objeto `CONTENT`.
- **Fala inicial de cada gatinho e textos da história:** `index.html`.
- **Cores:** variáveis no início de `css/style.css`. **Cor de cada gato:** atributo `data-cat` (`orange`, `gray`, `white` ou `black`) no `index.html`.
- **Música (notas e andamento):** `js/music.js`, constantes `BPM` e `BARS`.

> Atenção: o código do baú (`023`) também aparece no chip "Nº 023" e na tela inicial. Se mudar o código em `CONTENT.phase4.code`, mude os textos "023" no `index.html` e a dica da lupa em `puzzles.js`.

## Como ficou fácil de jogar

- **Fase 1:** tocar nas letras para montar a palavra (digitar continua disponível). Depois de 2 erros o jogo coloca a primeira letra.
- **Fase 2:** dica aparece já no primeiro erro.
- **Fase 3:** depois de 2 erros a chave começa a brilhar.
- **Fase 4:** o número no topo da tela fica piscando, tem pista no caderno e a dica aparece já no primeiro erro.
- **Gatinhos:** falam em cada fase e dão carinho/miau quando tocados.

## Som

- A **música** (🎵) começa quando ela toca em "INICIAR INVESTIGAÇÃO" e pode ser desligada a qualquer momento.
- Os **efeitos sonoros** (🔇/🔊, inclusive o miau) começam desligados.
- Para usar seus próprios áudios, coloque os arquivos em `assets/sounds/` e preencha `SOUND_FILES` em `js/effects.js`.

## Como executar localmente

Opção simples: dê dois cliques em `index.html`.

Opção recomendada (comporta-se como na internet):

```bash
cd projeto-secreto
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador. Para testar no celular, conecte-o na mesma rede Wi-Fi e abra `http://IP-DO-SEU-COMPUTADOR:8000`.

## Como publicar no GitHub Pages

1. Crie uma conta em [github.com](https://github.com), se ainda não tiver.
2. Clique em **New repository**, dê um nome (por exemplo `projeto-secreto`) e crie como **Public**.
3. Clique em **uploading an existing file** e envie **o conteúdo** da pasta `projeto-secreto` (o `index.html` precisa ficar na raiz do repositório, junto das pastas `css`, `js` e `assets`).
4. Clique em **Commit changes**.
5. Vá em **Settings → Pages**.
6. Em **Build and deployment → Source**, escolha **Deploy from a branch**, branch **main** e pasta **/ (root)**, e clique em **Save**.
7. Espere cerca de 1 a 2 minutos. O link aparece na mesma página, no formato `https://SEU-USUARIO.github.io/projeto-secreto/`.
8. **Abra o link no celular e jogue até o fim** antes de mandar, testando também os botões do WhatsApp.

Todos os caminhos do projeto são relativos, então ele funciona dentro do subdiretório.

## Gabarito

| Fase | Resposta |
|------|----------|
| 1 — O Chamado | `SEGREDO` |
| 2 — O Mapa Perdido | Caminho do **LIVRO** |
| 3 — Os Objetos Suspeitos | A **chave** |
| 4 — O Último Segredo | `023` (o número do projeto, piscando no topo da tela) |
| 5 — O Verdadeiro Objetivo | Os dois botões abrem o WhatsApp com mensagem pronta |

Easter eggs: toque 5 vezes no nome **PROJETO SECRETO** na tela inicial, e toque no chip **Nº 023** durante o jogo.
