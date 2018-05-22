#!/bin/sh
git clone --depth 1 https://github.com/CleverRaven/Cataclysm-DDA.git _catatmp
mkdir data
mv _catatmp/data/json data/
rm -rf _catatmp