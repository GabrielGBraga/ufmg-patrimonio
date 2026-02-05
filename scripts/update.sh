# 1. Try to update EAS
eas update --branch preview --message "Edição de patrimônios restringida por permissão." || {
    # If it fails, clean dependencies and reinstall
    echo "Erro no EAS Update. Limpando dependências..."
    rm -rf node_modules package-lock.json
    npm install
    
    # Try update again after install
    eas update --branch preview --message "Edição de patrimônios restringida por permissão."

    # 2. Add changes, commit and push
    git add .
    git commit -m "Updated permissions"
    git push
}

sudo shutdown -r now