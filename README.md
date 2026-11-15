# 🖥️ Dashboard de Sistemas Operacionais (SO)

**📍 Demos**

- **Modo servidor** (Render, mostra as métricas da máquina da nuvem): [https://so-co8a.onrender.com/](https://so-co8a.onrender.com/)
- **Modo agente** (hospedagem PHP, mostra as métricas de um PC): [https://mizzie.nyx.dev.br/musica/](https://mizzie.nyx.dev.br/musica/)

Aplicação **Node.js + Express** que monitora as métricas de uma máquina: CPU, memória, disco, rede, Git e arquivos do projeto. Foi desenvolvida como projeto integrador na Disciplina Sistemas Operacionais do curso de **Análise e Desenvolvimento de Sistemas** da **Fatec Itapetininga**, para estudar como uma aplicação web interage diretamente com o hardware da máquina host.

A interface tem o visual de um toca-discos: o arco ao redor do vinil mostra o uso de RAM e o disco gira enquanto a música toca.

---

## 📑 Sumário

- [Dois modos de uso](#-dois-modos-de-uso)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do repositório](#-estrutura-do-repositório)
- [Pré-requisitos](#-pré-requisitos)
- [Início rápido (modo local)](#-início-rápido-modo-local)
- [Músicas e atalhos](#-músicas-e-atalhos)
- [Rodar em segundo plano e ao ligar o PC](#-rodar-em-segundo-plano-e-ao-ligar-o-pc)
- [Modo agente: mostrar o seu PC num site](#-modo-agente-mostrar-o-seu-pc-num-site)
- [Rotas / API](#-rotas--api)
- [Como as métricas são coletadas](#-como-as-métricas-são-coletadas)
- [Banco de dados](#️-banco-de-dados)
- [Testes](#-testes)
- [Deploy no Render](#-deploy-no-render)
- [Segurança e privacidade](#-segurança-e-privacidade)
- [Limitações conhecidas](#️-limitações-conhecidas)
- [Solução de problemas](#-solução-de-problemas)
- [Autor](#-autor)

---

## 🔀 Dois modos de uso

O projeto funciona de duas formas. Você pode usar só uma ou as duas ao mesmo tempo.

|                              | **Modo local / servidor**                             | **Modo agente (site)**                                          |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Quem lê as métricas          | `index.js`, na hora de cada pedido                    | `agente.js`, no seu PC, que envia os dados para o site          |
| Onde a página roda           | `http://localhost:3000` ou uma hospedagem com Node    | Qualquer hospedagem com **PHP** (nada de Node no servidor)      |
| Atualização                  | A cada 10 segundos                                    | A cada 5 minutos (configurável)                                 |
| Métricas de qual máquina     | A que está rodando o `index.js`                       | O PC onde o `agente.js` está rodando                            |
| Se o PC desligar             | A página sai do ar                                    | A página continua no ar, com o último dado e o aviso "sem sinal" |

```
Modo local:   navegador  ──►  index.js (seu PC)  ──►  lê RAM, CPU, disco

Modo agente:  agente.js (seu PC) ──POST──►  receber.php ──►  dados.json
                                                               ▲
                              navegador  ──►  index.html  ─────┘
```

## ✨ Funcionalidades

O painel tem seis abas (também acessíveis por `#home`, `#hardware`, `#rede`, `#ficheiros`, `#faixas` e `#painel`):

| Aba           | O que mostra                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| **Home**      | Hostname, tempo online, uso de RAM, CPU e disco, visitas (ou tempo de PC ligado) e estado geral       |
| **Hardware**  | Modelo do processador, vCPUs, arquitetura, RAM total/livre, disco total/usado/livre                   |
| **Rede**      | Hostname, IP, sistema operacional, versão do Node, branch e commit do Git                             |
| **Ficheiros** | Primeiros 7 itens da pasta do projeto                                                                 |
| **Faixas**    | Lista de todas as faixas (suas músicas, ou os lo-fis gerados), com clique para tocar                  |
| **Painel**    | Gráfico do histórico de RAM (últimas 25 leituras) e último commit                                     |

Recursos adicionais:

- **Estado** calculado pelo uso de RAM: `estável` (até 65%), `sobrecarga` (acima de 65%) e `crítico` (acima de 85%). No modo agente aparece também `sem sinal` quando o PC para de enviar.
- **Log de eventos** na própria interface, com as últimas 15 mensagens.
- **Player de música** com voltar, tocar, pausar e próxima, e escolha direta pela aba Faixas.
- **Lo-fi gerado no navegador** (3 progressões diferentes) quando a pasta `musicas/` está vazia.
- **Efeitos sonoros** e alerta sonoro quando o estado piora. O botão "som" liga e desliga (a preferência fica no `localStorage`).

## 🧰 Tecnologias

- [Node.js](https://nodejs.org/) e [Express](https://expressjs.com/) `^5.2.1`
- Módulos nativos do Node: `os`, `fs`, `path` e `child_process`
- PHP simples (só no modo agente, no servidor de hospedagem)
- [PM2](https://pm2.keymetrics.io/) (opcional, para rodar em segundo plano)
- [Chart.js](https://www.chartjs.org/) e Google Fonts (Lexend e Quicksand), via CDN
- Web Audio API (sons e lo-fi gerados no navegador)

> O `package.json` também lista o pacote `cors`, mas o código atual não o utiliza.

## 📁 Estrutura do repositório

```
SO-project/
├── index.js              # Servidor Express: lê as métricas e entrega /api/dados e /api/musicas
├── agente.js             # Agente: lê as métricas do PC e envia para o site (modo agente)
├── public/
│   └── index.html        # Página do painel local (busca /api/dados)
├── site/                 # Arquivos para subir na hospedagem PHP (modo agente)
│   ├── index.html        # Página do painel (lê dados.json)
│   ├── receber.php       # Recebe os dados do agente e salva em dados.json
│   └── musicas.php       # Lista a pasta musicas/ do site
├── musicas/              # (opcional) suas músicas; o conteúdo fica fora do Git
├── ecosystem.config.js   # PM2: sobe painel e agente juntos
├── .env.example          # Modelo de configuração do agente (copie para .env)
├── .gitignore
├── package.json
└── README.md
```

> ⚠️ Existem **dois** `index.html` diferentes. O de `public/` busca `/api/dados` e só funciona com o `index.js` rodando. O de `site/` busca `dados.json` e é o que vai para a hospedagem. Não troque um pelo outro. Para saber qual é qual, procure no arquivo por `/api/dados` ou `dados.json`.

## 📋 Pré-requisitos

| Ferramenta                     | Versão                                  | Por quê                                                               |
| ------------------------------ | --------------------------------------- | --------------------------------------------------------------------- |
| [Node.js](https://nodejs.org/) | **18.15 ou superior** (20.6+ no agente) | Express 5 exige Node 18+; o disco usa `fs.statfsSync`; o agente usa `--env-file` |
| npm                            | Vem com o Node                          | Instalar as dependências                                              |
| [Git](https://git-scm.com/)    | Qualquer versão recente                 | Clonar o projeto e mostrar branch/commit no painel (opcional)         |
| Hospedagem com PHP             | PHP 7 ou superior                       | Só para o modo agente                                                 |

Funciona em **Windows, Linux e macOS**. Sem o Git instalado, branch e commit aparecem como `N/A`. É preciso internet no navegador para carregar o Chart.js e as fontes.

## 🚀 Início rápido (modo local)

```bash
# 1. Clone o repositório
git clone https://github.com/MizzieWiller/SO-project.git

# 2. Entre na pasta
cd SO-project

# 3. Instale as dependências
npm install

# 4. Inicie
npm start
```

O terminal mostra `painel pronto na porta 3000`. Abra no navegador:

```
http://localhost:3000
```

> ⚠️ Digite o **`http://`**. Se o navegador completar com `https://`, aparece `ERR_SSL_PROTOCOL_ERROR`, porque o servidor local não tem certificado.

Variáveis opcionais do painel local (defina no terminal antes de iniciar):

| Variável       | Padrão | Descrição                                                              |
| -------------- | ------ | ---------------------------------------------------------------------- |
| `PORT`         | `3000` | Porta do servidor                                                      |
| `PAINEL_SENHA` | vazio  | Se definida, o navegador pede senha (usuário: qualquer um)             |

```bash
# Linux / macOS
PORT=4000 PAINEL_SENHA=minhasenha node index.js

# Windows (PowerShell)
$env:PORT=4000; $env:PAINEL_SENHA="minhasenha"; node index.js
```

## 🎵 Músicas e atalhos

Coloque arquivos `.mp3`, `.ogg`, `.wav`, `.m4a` ou `.webm` na pasta `musicas/`. Atualize a página (`F5`) e eles aparecem no player e na aba **Faixas**. Não precisa reiniciar o servidor.

- As músicas tocam em **ordem alfabética**. Para controlar a ordem, comece os nomes com números (`01 - ...`, `02 - ...`).
- O nome mostrado é o do arquivo sem a extensão, então vale renomear os arquivos para algo curto.
- Com a pasta vazia, toca um **lo-fi gerado no navegador**. Os botões ❬❬ e ❭❭ e a aba Faixas alternam entre as 3 progressões.
- Ao terminar uma faixa, a próxima começa sozinha; a última volta para a primeira.
- O navegador só libera o áudio depois de um clique na página.

| Atalho    | Ação                    |
| --------- | ----------------------- |
| `←` / `→` | Faixa anterior / próxima |
| `Espaço`  | Tocar / pausar           |

> 🎼 Use somente músicas que você tem permissão para usar. A pasta `musicas/` está no `.gitignore`, então as suas músicas **não** vão para o GitHub. Se for subir o site para uma hospedagem, lembre que a pasta `musicas/` de lá fica pública.

## 🔁 Rodar em segundo plano e ao ligar o PC

Com o [PM2](https://pm2.keymetrics.io/), o painel continua rodando mesmo com o terminal fechado.

```bash
npm install -g pm2

pm2 start ecosystem.config.js     # sobe o painel e o agente
pm2 save                          # guarda a lista para religar depois
pm2 list                          # confere o que está rodando
pm2 logs agente --lines 20        # logs do agente
pm2 restart painel                # reinicia depois de editar o index.js
pm2 stop all                      # para tudo
```

Para subir só um dos dois: `pm2 start ecosystem.config.js --only painel` ou `--only agente`. Se você usa só o painel local, ignore o agente (ele não inicia sem o `.env`).

**Iniciar junto com o computador**

- **Linux / macOS:** rode `pm2 startup`, copie e execute o comando que ele mostrar, e depois `pm2 save`.
- **Windows (sem precisar de administrador):** crie um arquivo `iniciar-painel.bat` com o conteúdo abaixo e coloque na pasta que abre com `Win + R` → `shell:startup`.

```bat
@echo off
rem Só inclua a linha do PATH se o Node não estiver no PATH do Windows
set "PATH=%PATH%;C:\caminho\para\a\pasta\do\node"
cd /d "C:\caminho\para\SO-project"
timeout /t 20 /nobreak >nul
call pm2 resurrect
```

O `pm2 resurrect` só religa o que foi salvo com `pm2 save`. Sempre que mudar a lista de processos, rode `pm2 save` de novo.

## 🌐 Modo agente: mostrar o seu PC num site

Uma página hospedada na internet não consegue ler a RAM do seu computador. Por isso um pequeno programa, o **agente**, roda no seu PC, junta os dados e os envia para o site, que só mostra o último que chegou.

**1. Escolha uma senha (token)** e coloque-a na linha `$TOKEN` do arquivo `site/receber.php`.

**2. Suba os arquivos da pasta `site/`** para a hospedagem (por exemplo, para `public_html` ou para uma subpasta):

- `index.html`
- `receber.php`
- `musicas.php`
- `musicas/` (pasta, pode ficar vazia; vazia toca o lo-fi gerado)

Não suba o `agente.js`, o `.env`, o `.git` nem o `node_modules`. O `dados.json` é criado sozinho no primeiro envio, e a pasta precisa aceitar escrita (o padrão das hospedagens costuma aceitar).

**3. Confira o `receber.php` no navegador.** Abra `https://seudominio.com/receber.php`. Tem que aparecer `{"erro":"metodo"}`. Se der 404, o arquivo não está nesse endereço.

**4. Configure o agente no PC.** Copie `.env.example` para `.env` e preencha:

```
PAINEL_URL=https://seudominio.com/receber.php
PAINEL_TOKEN=a-mesma-senha-do-receber-php
PAINEL_INTERVALO=5
```

Se o site está numa subpasta, inclua ela na URL (`https://seudominio.com/painel/receber.php`).

**5. Rode o agente:**

```bash
npm run agente
```

Tem que aparecer `agente iniciado` e `dados enviados`. O agente só escreve `dados enviados` quando o `receber.php` confirmou que salvou.

**6. Abra o site.** Em `https://seudominio.com` aparece o painel com os dados do seu PC e, embaixo da coluna Sistema, o horário do último dado. Para deixar o agente rodando sem terminal, use o PM2 (seção acima).

Se o PC parar de enviar por mais de 3 intervalos (15 minutos, no padrão), o painel mostra **"sem sinal"** e continua exibindo o último dado recebido.

## 🔌 Rotas / API

**Servidor local (`index.js`)**

| Método | Rota                 | Descrição                                                       | Resposta           |
| ------ | -------------------- | --------------------------------------------------------------- | ------------------ |
| `GET`  | `/`                  | Página do painel (`public/index.html`)                          | `text/html`        |
| `GET`  | `/api/dados`         | Métricas atuais da máquina (JSON)                               | `application/json` |
| `GET`  | `/api/musicas`       | Lista de músicas da pasta `musicas/`                            | `application/json` |
| `GET`  | `/musicas/<arquivo>` | Arquivo de áudio                                                | Áudio              |

A página busca `/api/dados` a cada 10 segundos e atualiza o conteúdo sem recarregar, então a música e a rotação do vinil não reiniciam. As visitas contam só os acessos a `/`, não as atualizações automáticas.

**Hospedagem PHP (modo agente)**

| Método | Rota           | Descrição                                                               |
| ------ | -------------- | ----------------------------------------------------------------------- |
| `POST` | `receber.php`  | Recebe o JSON do agente (cabeçalho `X-Token`) e grava em `dados.json`   |
| `GET`  | `dados.json`   | Último dado recebido, com o horário de chegada (`recebidoEm`)           |
| `GET`  | `musicas.php`  | Lista de músicas da pasta `musicas/` do site                            |

```bash
curl http://localhost:3000/api/dados
curl http://localhost:3000/api/musicas
```

## 📊 Como as métricas são coletadas

| Métrica                        | Origem                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------- |
| RAM total / livre / %          | `os.totalmem()` e `os.freemem()`                                              |
| CPU (%)                        | Servidor local: média dos contadores de `os.cpus()`. Agente: leitura real, comparando duas amostras com 1 s de intervalo |
| Modelo, vCPUs, arquitetura     | `os.cpus()` e `os.arch()`                                                     |
| Disco                          | `fs.statfsSync` na raiz do disco (funciona no Windows, Linux e macOS)         |
| Git (branch, commit, mensagem) | `git` chamado sem shell, com cache de 1 minuto (não abre janela de terminal no Windows) |
| IP                             | Primeira interface IPv4 não interna de `os.networkInterfaces()`               |
| Tempo online                   | `process.uptime()` (servidor) ou `os.uptime()` (agente: "pc ligado há")       |
| Histórico de RAM               | Últimas 25 amostras (a cada 10 s no servidor; a cada envio no agente)          |

## 🗄️ Banco de dados

**Não se aplica.** No servidor local, o contador de visitas, o histórico de RAM e o log ficam **em memória** e zeram quando o processo reinicia. No modo agente, o único "armazenamento" é o arquivo `dados.json`, que guarda só o último envio.

## 🧪 Testes

Ainda não há testes automatizados. A verificação é manual:

1. `npm start` e confirmar `painel pronto na porta 3000`.
2. Abrir `http://localhost:3000` e navegar pelas seis abas.
3. Aguardar 10 segundos e ver os valores e o gráfico atualizarem sem recarregar.
4. Comparar RAM, CPU e disco com o Gerenciador de Tarefas (ou `htop`).
5. Abrir `http://localhost:3000/api/dados` e ver o JSON.
6. Clicar em ▶, testar ❬❬, ❭❭, a aba Faixas e os atalhos do teclado.
7. Modo agente: `npm run agente`, ver `dados enviados`, abrir `dados.json` no site e conferir que o horário mudou.
8. Pare o agente e espere 15 minutos: o site deve mostrar "sem sinal".

## 🚀 Deploy no Render

O modo servidor roda no Render como *Web Service*: [https://so-co8a.onrender.com/](https://so-co8a.onrender.com/)

1. Faça um fork do repositório.
2. No [Render](https://dashboard.render.com/), **New → Web Service** e conecte o repositório.
3. Preencha: Runtime `Node`, Branch `main`, Build Command `npm install`, Start Command `node index.js`.
4. O Render define `PORT` sozinho. Opcional: crie `PAINEL_SENHA` nas variáveis de ambiente para proteger o painel.

> ℹ️ No Render, as métricas são do **servidor da nuvem** (host), e não só da cota do seu serviço.
>
> ℹ️ No plano gratuito o Render hiberna serviços sem acesso. O ping automático que existia nas versões anteriores foi removido. Se quiser manter o serviço acordado, use um monitor externo (como UptimeRobot ou cron-job.org) apontando para `/api/dados`.

## 🔒 Segurança e privacidade

- **`dados.json` é público.** No modo agente ele mostra o nome do PC, o IP da rede local, o modelo do processador, a lista de arquivos da pasta do projeto e a mensagem do último commit. Se isso incomoda, proteja a pasta do site com senha no painel da hospedagem ou me peça para tirar esses campos.
- **O token é a única proteção do `receber.php`.** Troque `troque-esta-senha` por uma senha sua nos dois lugares (`site/receber.php` e `.env`). Quem tem o token consegue enviar dados falsos para o seu painel.
- **Nunca suba o `.env`.** Ele já está no `.gitignore`. Se vazar, troque a senha no `receber.php` e no `.env`.
- **Não suba para a hospedagem** o `.git`, o `node_modules`, o `agente.js` nem o `.env`.
- Em hospedagem pública, use HTTPS. O agente avisa se o endereço foi redirecionado.
- No painel local, use `PAINEL_SENHA` se for expor a porta fora da sua rede.

## ⚠️ Limitações conhecidas

- **CPU do servidor local não é em tempo real:** é a média desde que a máquina ligou (contadores de `os.cpus()`), então varia pouco. O agente mede o uso real.
- **Modo agente tem atraso:** o dado tem até 5 minutos (ou o intervalo que você escolher).
- **Histórico em memória:** o do servidor local zera ao reiniciar. O do agente zera ao reiniciar o agente.
- **Músicas novas** só aparecem depois de atualizar a página (`F5`).
- **Dependência sem uso:** o `cors` está no `package.json`, mas não é utilizado.

## 🩹 Solução de problemas

| Problema                                           | Causa provável                                                  | Solução                                                                                 |
| -------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `ERR_SSL_PROTOCOL_ERROR` em `localhost`            | Navegador abriu `https://`                                      | Digite `http://localhost:3000`                                                          |
| `Cannot find module 'express'`                     | Dependências não instaladas                                     | Rode `npm install`                                                                      |
| `EADDRINUSE`                                       | Porta em uso (ou o PM2 já está rodando o painel)                | Use outra porta, ou `pm2 restart painel`                                                |
| `node` ou `pm2` "não reconhecido"                  | Node/PM2 fora do PATH (comum com Node portátil, sem admin)      | Adicione a pasta do Node e `%APPDATA%\npm` ao PATH do usuário, ou use `NODE_BIN`        |
| `Script already launched` no PM2                   | O arquivo já está registrado                                    | Use `pm2 restart <nome>`; veja os nomes em `pm2 list`                                   |
| Janela de terminal piscando no Windows             | Versão antiga chamando `df`/`git` com shell                     | Atualize para esta versão (usa `statfs` e `git` sem shell)                              |
| Agente: "Configuração incompleta"                  | Falta o `.env`                                                  | `cp .env.example .env` e preencha `PAINEL_URL` e `PAINEL_TOKEN`                         |
| Agente: `falha no envio: o site respondeu 403`     | Token diferente entre `.env` e `receber.php`                    | Deixe as duas senhas iguais                                                             |
| Agente: "não veio do receber.php"                  | `PAINEL_URL` errada (ou falta a subpasta)                       | Confira a URL; abrir `receber.php` no navegador deve mostrar `{"erro":"metodo"}`        |
| Agente: "redirecionado para ..."                   | O site redireciona (http → https, ou com/sem `www`)             | Use na `PAINEL_URL` o endereço final que ele mostrar                                    |
| Site mostra só o desenho, sem dados                | `index.html` errado (o de `public/` no lugar do de `site/`)     | Suba o `site/index.html`. Ele deve conter `dados.json`, e não `/api/dados`              |
| Site mostra "sem sinal"                            | O agente parou, ou o PC está desligado                          | `pm2 list` e `pm2 logs agente`; veja se aparece `dados enviados`                        |
| Branch/commit aparecem como `N/A`                  | Pasta sem repositório Git ou Git não instalado                  | Rode dentro do clone e instale o Git                                                    |
| Sem som ao abrir a página                          | O navegador bloqueia áudio antes de uma interação               | Clique em qualquer lugar ou no ▶                                                        |
| Repositório pesado                                 | `node_modules/` está no Git                                     | Veja abaixo                                                                             |

**Tirar `node_modules/` do Git** (quem clonar roda `npm install`):

```bash
git rm -r --cached node_modules
git add .gitignore
git commit -m "Remove node_modules do versionamento"
git push
```

## 👤 Autor

Desenvolvido por **MizzieWiller** como projeto integrador da **Fatec Itapetininga**, curso de Análise e Desenvolvimento de Sistemas.
