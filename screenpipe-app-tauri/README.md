
Refer to the [official documentation](https://docs.screenpi.pe/getting-started) for more information.

## Linux build requirements

Before building the Tauri application on Linux, install the required development packages:

```bash
sudo apt install libwebkit2gtk-4.1-dev \
    libgtk-3-dev libayatana-appindicator3-dev \
    librsvg2-dev libssl-dev build-essential fuse
```

AppImage packaging requires FUSE and access to `/dev/fuse`. In restricted environments, set `APPIMAGE_EXTRACT_AND_RUN=1`.

If bundling the media framework is needed, also install:

```bash
sudo apt install gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
    gstreamer1.0-libav patchelf
```

Make sure the Tauri CLI version matches the Rust crate version and avoid stripping the binary before packaging.

