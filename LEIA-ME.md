# Leonida Offline

Mapa de Leonida (GTA VI) para usar no iPhone sem internet. É um fork do
[Leonida Atlas](https://github.com/navanem/gta6-leonida-atlas) (AGPL-3.0) com:

- mapa oficial do jogo e mapa da comunidade (Yanis v18) em tiles, com zoom até o nível de rua;
- download dos mapas para uso offline, com pausa e retomada;
- filtros por serviço do jogo (postos, roupas, armas, transporte…), salvos no aparelho;
- "Marcar encontrado" e "Ocultar encontrados";
- marcadores do GTADB na revisão de 19/11/2026 (3.754 lugares);
- interface em português.

## Fontes e licenças

- Lugares, tiles e fotos: [GTADB](https://github.com/rolux/gtadb.org) / Map GTA e colaboradores, CC BY 4.0.
- Mapa da comunidade: Yanis v18 (via GTADB). Mapa oficial: Rockstar Games (via GTADB).
- Código: Leonida Atlas, AGPL-3.0. Projeto de fã, sem vínculo com a Rockstar Games ou a Take-Two.

## Atualizar

```sh
git -C ../fontes/gtadb pull
node scripts/copy-gtadb-tiles.mjs ../fontes/gtadb/maps/tiles/6
ATLAS_BASE_PATH=/leonida-offline/ pnpm build
```

O site publicado é a pasta `dist/`, no branch `gh-pages`.
