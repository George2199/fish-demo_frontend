#!/bin/bash
set -x

date
cd /home/fish-demo_frontend || exit

git add .
git commit -m "auto commit $(date '+%Y-%m-%d %H:%M:%S')"
git push