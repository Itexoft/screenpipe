#!/bin/sh
if [ "$APPIMAGE_EXTRACT_AND_RUN" != "1" ] && [ ! -e /dev/fuse ]; then
  echo missing fuse
  exit 1
fi
if [ "$APPIMAGE_EXTRACT_AND_RUN" != "1" ] && ! ldconfig -p | grep -q libfuse; then
  echo missing libfuse
  exit 1
fi
