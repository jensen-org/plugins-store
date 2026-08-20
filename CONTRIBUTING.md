# Submitting a plugin

You need a plugin that is already built, released, and documented. See
[AUTHORING.md](https://github.com/jensen-org/official-plugins/blob/main/AUTHORING.md) if you are
starting from nothing.

## Steps

1. **Publish your release.** From your plugin directory, `jensen publish`. It generates and validates
   `manifest.json`, pins every artifact it ships, assembles `release/`, and prints your entry. Then
   cut a GitHub release on your own repository whose tag equals the `version` (or your `jensen.tag`),
   uploading every file in `release/`.

2. **Add one file:** `entries/<your-id>.json`, containing exactly the entry `jensen publish` printed.
   The filename must match the `id` inside it.

3. **Open a pull request.** CI validates the entry and downloads your release to confirm it exists
   and its checksum matches. Both must pass.

Do not edit `index.json`. It is built from `entries/` and committed by CI when your PR lands.

## Requirements

- The repository hosting your release must be **public**. Jensen fetches releases anonymously.
- Your plugin must ship a `README.md`. `jensen publish` enforces this. It is rendered in the app when
  a user opens your plugin's detail view, before they install, so it is what they read while deciding
  whether to grant the permissions you ask for.
- Ask for the least you need. Every capability becomes a line on the consent screen.

## Updating a plugin

Bump `version`, re-release, and update the same `entries/<id>.json` with the new version, tag and
`sha256`. An unchanged `sha256` alongside a bumped version means you uploaded the old manifest; CI
checks the checksum against the live release and will reject it.

## Removing a plugin

Delete your entry file and say why in the PR. Users who already installed it keep it; the catalog
simply stops offering it.

## Running the checks locally

```sh
node scripts/validate.mjs   # schema and naming
node scripts/verify.mjs     # downloads each release and checks its checksum
node scripts/build-index.mjs
```

No install step: the scripts have no dependencies. That is deliberate. This repository is the gate
every plugin passes through, and pulling a validator from npm at CI time would put the whole
ecosystem behind someone else's supply chain.
