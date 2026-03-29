# Labyrint Hero

Et 2D topp-ned labyrinth-eventyrspill med prosedyregenererte verdener, heltebygging, monstre og episke bosser.

## Status
🚧 Under utvikling – spec-fase

## Hurtigstart
_(Kommer når teknologivalg er gjort)_

## Dokumentasjon
- [Game Design Document](docs/GDD.md) – Full spillbeskrivelse og regler
- [Teknisk arkitektur](docs/ARCHITECTURE.md) – Systemdesign og teknologivalg _(kommer)_
- [Endringslogg](docs/CHANGELOG.md)

## Mappestruktur
```
LabyrintHero/
├── assets/
│   ├── images/       # Grafikk: helt, monstre, kart, UI
│   ├── sounds/       # Musikk og lydeffekter
│   └── fonts/        # Skrifttyper
├── src/
│   ├── core/         # Spillmotor: loop, input, state
│   ├── world/        # Labyrintgenerering, tåke, kart
│   ├── entities/     # Helt, monstre, bosser, dyr, gjenstander
│   ├── ui/           # HUD, menyer, karakterskaper
│   └── utils/        # Hjelpefunksjoner
├── docs/             # Design- og arkitekturdokumenter
├── config/           # Spillkonfigurasjon og balansering
└── tests/            # Tester
```
