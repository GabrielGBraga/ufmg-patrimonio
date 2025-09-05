
/**
 * Essas são as características de um patrimônio utilizadas no aplicativo.
 */
export const patrimonio = {
    image: {
        url: '',
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
    lastEditedBy: '',
    lastEditedAt: ''
};

export type Patrimonio = typeof patrimonio;

export const labelPatrimonio = {
    image: {
        url: '',
        height: 0,
        width: 0,
    },
    patNum: 'Número de Patrimônio',
    atmNum: 'Número ATM',
    descricao: 'Descrição',
    valor: 'Valor',
    conservacao: 'Conservação',
    responsavel: 'Responsável',
    sala: 'Sala',
    lastEditedBy: '',
    lastEditedAt: ''
}