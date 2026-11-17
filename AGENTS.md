# Agent guide

Rules for anyone (people or AI agents) committing to Unicornia.

## Commits and PR titles: Conventional Commits

Every commit message and every PR title follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <short summary>
```

PRs are **squash-merged**, so the PR title becomes the commit on `main`. The `PR title` check fails until the title follows the format. The summary can be in Spanish or English; keep it short and imperative, and put the details in the PR body.

| Type | Use it for | Version bump |
|---|---|---|
| `feat` | Something new for the player: a category, a step, an option, a pose, a sticker | minor (0.**x**.0) |
| `fix` | A bug fix or a small polish of something that already exists | patch (0.0.**x**) |
| `perf` | Faster or lighter, same behaviour | patch |
| `refactor`, `style`, `docs`, `test`, `build`, `ci`, `chore` | Anything that does not change the game for the player | none |

Examples:

- `feat: borrador para quitar stickers y tatuajes uno por uno`
- `feat(poses): pose Tierna para la foto`
- `fix: el zoom de Safari ya no se queda atascado en iPad`
- `fix(menus): stickers sin scroll lateral en celular`
- `perf: modo ligero con menos partículas`
- `docs: explicar los parámetros de URL`
- `ci: versionar con semantic-release`

## Versioning (0.x for now)

- [semantic-release](https://semantic-release.gitbook.io/) runs on every push to `main` (`.github/workflows/deploy.yml`, config in `.releaserc.json`). It reads the commits since the last tag, creates the `vX.Y.Z` tag and a GitHub release with notes. Nothing is committed back to `main`.
- The game stays in **0.x** until the owner declares 1.0. Breaking changes (`feat!:` or `BREAKING CHANGE:`) bump the **minor**, never the major. Going to 1.0 is a deliberate change to `.releaserc.json`, not a commit type.
- A manual run of **Deploy** on `main` (Actions > Deploy > Run workflow) also releases: use it when GitHub drops the push event of a merge.
- The git tag is the source of truth; there is no version in any file.

## Version in the game

- `scripts/build.mjs` stamps the version from `git describe --tags` into `<meta name="version">`: `0.3.0` on a release, `0.3.0-2-gabc1234` on later builds (previews, local). `GAME_VERSION=...` overrides it; without a build it reads `dev`.
- The game reads it into `VERSION` (`public/index.html`). On screen it only shows with `?dev`, as a small label at the bottom centre, and in the `?fps=1` readout. Nothing visible to the child.

## Screenshots

PRs with visual changes include before and after screenshots.
