# LIVEW — Site (Hero Parallax)

Site estático (HTML + CSS + JS puro, sem build). GSAP, ScrollTrigger e Lenis são carregados via CDN em tempo de execução pelo próprio `script.js`.

## Estrutura

```
index.html   → markup da página (documento HTML completo)
style.css    → todos os estilos
script.js    → preloader, parallax, navegação, animações GSAP/ScrollTrigger/Lenis
vercel.json  → configuração mínima de deploy (URLs limpos)
```

## Testar localmente

Basta abrir `index.html` no browser, ou correr um servidor estático:

```bash
npx serve .
```

## Subir para o GitHub

```bash
cd "/Users/ricardopinto/Obsidian/Estudio/livew/site"
git init
git add .
git commit -m "Site LIVEW — versão inicial"
git branch -M main
git remote add origin https://github.com/<teu-utilizador>/<nome-do-repo>.git
git push -u origin main
```

(Cria primeiro o repositório vazio em github.com/new, ou usa `gh repo create <nome-do-repo> --public --source=. --push` se tiveres o GitHub CLI instalado e autenticado.)

## Publicar na Vercel

Depois do push para o GitHub:

1. Vai a [vercel.com/new](https://vercel.com/new) e liga a tua conta GitHub.
2. Importa o repositório.
3. Framework Preset: **Other** (site estático). Não é preciso Build Command nem Output Directory — a Vercel serve `index.html` diretamente da raiz.
4. Clica em **Deploy**.

Alternativa via CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Notas

- As imagens e o vídeo do hero apontam para `darkslategray-vulture-786068.hostingersite.com` (Hostinger). Continuam a carregar normalmente a partir da Vercel, mas se um dia migrares esses ficheiros, atualiza os `src=` em `index.html`.
- Fontes (Poppins) carregadas via Google Fonts no `style.css`.
