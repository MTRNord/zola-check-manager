# Zola Check Manager

[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2FMTRNord%2Fzola-check-manager%2Fbadge&style=flat)](https://actions-badge.atrox.dev/MTRNord/zola-check-manager/goto)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/MTRNord/zola-check-manager?sort=semver)

A Github action to track the status of a `zola check` using check runs.

## Usage

```yaml
name: Zola Check

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  zola-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: MTRNord/zola-check-manager@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

* `working_directory`: The folder where the `zola check` should be executed. Default: `.`
* `repo-token`: The token to use to authenticate with Github. Default: `${{ secrets.GITHUB_TOKEN }}`. This requires the `checks:write` permission.
* `conclusion_level`: The conclusion level to use. Default: `failure`. Can be `action_required`, `failure`, `neutral`, `success`. Default: `action_required`
