# Jensen plugin store

The catalog Jensen installs from. This repository holds **no plugin code**: only one small entry per
plugin, saying where its release lives and what its checksum is.

Jensen fetches:

```
https://raw.githubusercontent.com/jensen-org/plugins-store/main/index.json
```

That URL is read **anonymously, with no credential, ever**. A token shipped inside a desktop app can
be extracted from it, so this repository is public and stays public. If the file is unreachable the
Plugins page shows a calm empty state rather than an error, and installed plugins keep working
because they live on the user's machine.

Users can turn the public store off, or point Jensen at a private one, from Settings, Plugins.

## Layout

```
entries/<id>.json   one file per plugin, submitted by pull request
index.json          the catalog, built from entries/ by CI. Do not edit by hand
schema.json         the contract an entry must satisfy
scripts/            validate, verify, and build. No dependencies, on purpose
```

One file per plugin rather than one shared array: two plugins published the same week do not conflict.

## What an entry is

```json
{
  "id": "acme.markdown-lint",
  "name": "Markdown Lint",
  "author": "Acme",
  "description": "Flags style issues in Markdown as you type.",
  "category": "lint",
  "version": "1.2.0",
  "min_app_version": "0.1.0",
  "repo": "acme/md-lint",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

It locates a plugin and pins it. It carries no capabilities and no code. `sha256` is the checksum of
the release `manifest.json`, and because that manifest pins the checksum of every artifact it ships,
this one hash vouches for the entire download. A tampered release is rejected at install with no keys
to manage.

Add `"tag"` when the release tag is not just the version, which a monorepo shipping several plugins
needs. Omit it and the tag is the version.

What a plugin is *allowed* to do is decided by the sandbox and the consent screen, never here.

## What CI enforces

Every pull request runs, before a human looks at it:

1. **Schema validation** of each entry, plus the rule that `entries/<id>.json` is named after the id.
2. **Release verification**: it downloads the release manifest the entry points at, checks the
   `sha256` matches, and confirms the manifest's own id and version agree with the entry.

The second check exists because the first catalog shipped six entries pointing at repositories that
had never been created. Every Install failed on its first fetch, and nothing caught it for months.
An entry that cannot be installed can no longer be merged.

## Publishing

See `CONTRIBUTING.md`. Plugin authoring itself is documented in
[jensen-org/official-plugins](https://github.com/jensen-org/official-plugins/blob/main/AUTHORING.md).
