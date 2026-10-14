# Verify it yourself

Here are four checks, from the easiest to the most thorough. You don't need to trust us for any of them.

## 1. Airplane mode (anyone, 1 minute)

1. Open [social9.s4meer.com/editor](https://social9.s4meer.com/editor) and use each tool once, so the AI
   models are saved on your device.
2. Turn on airplane mode, or unplug from the internet.
3. Open a photo and edit it: remove the background, blur faces, save it.

Everything still works. With no connection, nothing could have been sent.

## 2. Watch the network (anyone with a desktop browser, 3 minutes)

1. Open the editor, then your browser's developer tools (F12, or ⌥⌘I on a Mac) → **Network**.
2. Edit and save a photo.
3. Look at the requests. You'll see only the hosts listed in [network.md](network.md):
   page files, model files, and the AI runtime. No request carries image data.
   (Your photo shows up as a `blob:` URL: that's memory inside your own browser tab.)

## 3. Read the security policy the browser enforces (2 minutes)

In developer tools → **Network**, click the page request (the first one) and look at
**Response Headers → Content-Security-Policy**. Or, on any page, in the console:

```js
document.querySelector('meta[http-equiv="Content-Security-Policy"]').content
```

Compare it with [`src/security/csp.ts`](../src/security/csp.ts). The `connect-src` line is
the full list of places the page is allowed to talk to. The browser enforces it, not us.

## 4. Check the models and the code (developers)

```sh
git clone <this repository> && cd social9-core
npm install
npm test
npm run verify-models           # every model matches its pinned SHA-256
```

Then read [`src/ml/models.ts`](../src/ml/models.ts) (what's downloaded, and the hash check)
and [`src/convert/encoders.ts`](../src/convert/encoders.ts) (how the saved file is written).

You can also confirm a saved photo carries no metadata:

```sh
exiftool your-photo-social9.jpg   # no GPS, no camera, no date
```

## Found something?

If any of these checks shows something it shouldn't, please tell us: [SECURITY.md](../SECURITY.md).
