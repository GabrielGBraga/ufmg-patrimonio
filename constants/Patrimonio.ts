import { StorageReference } from 'firebase/storage';

/**
 * Essas são as características de um patrimônio utilizadas no aplicativo.
 */
export const patrimonio = {
    image: {
        ref: '' as StorageReference | '',
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