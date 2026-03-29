# Opprett GitHub-repo for Labyrint Hero

Alle filene er klare. Følg disse stegene i terminalen på din egen maskin.

---

## Steg 1 – Åpne terminal og naviger til mappen

```bash
cd /sti/til/LabyrinthHero
```

> Erstatt stien med der du har mappen på din maskin (f.eks. `~/Dokumenter/LabyrinthHero`).

---

## Steg 2 – Initialiser git og gjør første commit

```bash
git init
git branch -m main
git add -A
git commit -m "Initial commit – Labyrint Hero v0.8"
```

---

## Steg 3 – Opprett tomt repo på GitHub

1. Gå til **https://github.com/new**
2. Fyll inn:
   - **Repository name:** `labyrint-hero`
   - **Description:** `Phaser 3 roguelike dungeon crawler`
   - **Visibility:** Public eller Private etter ønske
3. **IKKE** huk av "Add README", "Add .gitignore" eller "Choose license" (vi har allerede disse)
4. Klikk **Create repository**

---

## Steg 4 – Koble til GitHub og push

Bytt ut `DITT_BRUKERNAVN` med ditt GitHub-brukernavn:

```bash
git remote add origin https://github.com/DITT_BRUKERNAVN/labyrint-hero.git
git push -u origin main
```

Du vil bli bedt om GitHub-brukernavn og passord/token.

> **NB:** GitHub krever Personal Access Token (ikke vanlig passord).
> Lag token her: **https://github.com/settings/tokens/new**
> Gi den `repo`-tilgang, kopier og bruk som passord når git spør.

---

## Etter push

Spillet ditt ligger på:
```
https://github.com/DITT_BRUKERNAVN/labyrint-hero
```

Du kan aktivere **GitHub Pages** (Settings → Pages → branch: main, root) for å spille spillet direkte i nettleseren via en offentlig URL.
