
/**
 * Essas são as características de um patrimônio utilizadas no aplicativo.
 */
export const patrimonio = {
    image: {
        url: '', // O valor inicial deve ser null, pois `StorageReference` não pode ser instanciado diretamente
        height: 0,
        width: 0,
    },
    patNum: '',
    atmNum: '',
    descricao: '',
    valor: '',
    conservacao: '',
    responsavel: '',
    sala: '',
    email: ''
};

export type Patrimonio = typeof patrimonio;