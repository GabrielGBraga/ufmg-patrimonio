# 1. Tenta realizar o update do EAS
eas update --branch preview --message "Edição de patrimônios restringida por permissão." || {
    # Se falhar, executa a limpeza e reinstalação
    echo "Erro no EAS Update. Limpando dependências..."
    rm -rf node_modules package-lock.json
    npm install
    
    # Tenta o update novamente após o install
    eas update --branch preview --message "Edição de patrimônios restringida por permissão."
}

# 2. Adiciona as mudanças, faz o commit e o push
git add .
git commit -m "Criação do botão de editar permissões"
git push