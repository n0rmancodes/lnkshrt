# LnkShrt
LnkShrt is a simple, no dependency, and customizable NodeJS link shortener.

Meant for use on any short domains you got, free, unlicensed.

## Features
- Password/Captcha (via hCaptcha) protection on links
- No server-side tracking
- API for programmers

## Configuration
You can edit ``config.json`` to your liking.

```json
allowPasswords: true
```
This allows passwordable links in your instance. (Default: ``true``) (Choices: ``true``/``false``)

```json
allowCaptcha: true,
hCaptchaKey: "[key]"
```
This allows hCaptcha-protected links. If it it is ``true``, you must provide a key for it. (Default: ``false``) (Choices: ``true``/``false``) 

```json
idLength: 5
```
This is how long the IDs are.

```json
port: 3333
```
Port is an interger of what port you want the instance to be hosted on, default is ``3333``.