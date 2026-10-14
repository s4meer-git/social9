# Security policy

## What counts as a security issue here

Anything that breaks the promise that photos stay on the device, for example:

- a way for a photo, or anything derived from it, to reach a network
- a hole in the [Content-Security-Policy](src/security/csp.ts)
- a way to make the app run a model or script that doesn't match its pinned hash
- metadata (GPS, camera serial, date) surviving into a saved file
- the usual web issues: XSS, malicious files that crash or take over the page

## How to report

Email [sameer.fyi@hotmail.com](mailto:sameer.fyi@hotmail.com) with steps to reproduce. Please don't open a public issue for
anything exploitable until it's fixed.

You'll get a reply within 3 working days. Once it's fixed, we'll credit you in the release
notes if you'd like.

## Supported versions

Only the version running on social9.s4meer.com, which is built from the latest commit on `main`.
