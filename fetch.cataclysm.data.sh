#!/bin/sh
git clone --depth 1 https://github.com/CleverRaven/Cataclysm-DDA.git _catatmp
mv _catatmp/data .
rm -rf _catatmp