# Labyrint Hero – Development Rules

## Language
- **Code comments & commits:** English
- **GitHub issues & PR descriptions:** English
- **Game Design Document (GDD) & Changelog:** Norwegian (existing convention)

## Workflow

### Issues
- Use GitHub issues to track all features, bugs, and improvements
- Reference issue numbers in commits (e.g., `Fix monster pathfinding #12`)
- Close issues via commit messages when appropriate (`Closes #12`)

### Branching
- Develop on feature branches, not directly on `main`
- Branch naming: `claude/<short-description>`

### Commits
- Write clear, concise commit messages in English
- Reference related issues in commit messages
- One logical change per commit

### Documentation Updates
After every change that affects gameplay, systems, or balance:

1. **CHANGELOG.md** (`docs/CHANGELOG.md`)
   - Add entry under current version section
   - Follow existing format: `### New features`, `### Bug fixes`, `### Technical changes`
   - If a new version is started, follow semver-style (v0.9, v1.0, etc.)

2. **Game Design Document** (`docs/GDD.md`)
   - Update relevant sections to reflect the current state of the game
   - Keep version number and "last updated" date current

### Code Style
- Vanilla JavaScript (no build tools, no TypeScript)
- Phaser 3 via CDN – no npm dependencies
- Procedural graphics and audio – no asset files
- Follow existing patterns in the codebase (scene structure, entity classes, etc.)

### Testing
- Open `index.html` in browser to play-test changes
- Use `simulator.html` for balance verification
- Verify save/load still works after changes affecting Hero, Inventory, or progression
