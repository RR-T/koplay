# Samsung Tizen TV wrapper

A thin Tizen web app that shows your KoPlay display full screen and adds a remote-control
"exit?" prompt. It contains no server address: you supply yours when building.

```bash
KOPLAY_URL=https://your-server.example/screen/local ./build.sh
```

`KOPLAY_URL` should be a stable address (a quick-tunnel URL changes every run). The script
stages the app in `build/app` and, if the Tizen CLI is installed and `TIZEN_PROFILE` names a
signing profile, packages it as a `.wgt`; otherwise open `build/app` in Tizen Studio and sign
it with your own certificate.

Do not commit the `.wgt` (it is gitignored): it embeds your URL and your signing certificates.
The Tizen application id is `KoPlayTV01.KoPlay`.
