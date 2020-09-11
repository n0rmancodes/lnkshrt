# LnkShrt
LnkShrt is a simple, no dependency, and customizable NodeJS link shortener.

Meant for use on any short domains you got, free, unlicensed.
## Features
- Password protection on links
- Editable words to include in links
- No tracking
- API for programmers
## Configuration
You can edit ``config.json`` to your liking.

```json
allowPasswords: true
```
This allows passwordable links in your instance. (Default: ``true``) (Choices: ``true``/``false``)

```json
idType: "generic"
```
This is the choice of how IDs are created.

Examples:

"generic" => "9jqFX"

"word" => "CleaversDamieSolomonicalMuciditySupergravitating"

(Default: ``generic``) (Choices: ``generic``/``word``)

```json
idLength: 5
```
This is how long the IDs are. 5 means 5 letters for ``"generic'`` and 5 words for ``"word"``.