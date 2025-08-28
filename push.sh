#!/bin/bash
# Script para facilitar commits no Replit
# Uso: bash push.sh "sua mensagem de commit"

git add .
git commit -m "$1"
git push origin main
