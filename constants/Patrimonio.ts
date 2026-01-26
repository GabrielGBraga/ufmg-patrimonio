
/**
 * Essas são as características de um patrimônio utilizadas no aplicativo.
 */
export const patrimonio = {
    image: {
        fileName: '',
        height: 0,
        width: 0,
    },
    patNum: '',
    atmNum: '',
    descricao: '',
    valor: '',
    conservacao: '',
    owner_id: '',
    sala: '',
    lastEditedBy: '',
    lastEditedAt: ''
};

export type Patrimonio = typeof patrimonio;

export const labelPatrimonio: Patrimonio = {
    image: {
        fileName: '',
        height: 0,
        width: 0,
    },
    patNum: 'Nº Patrimônio',
    atmNum: 'Nº ATM',
    descricao: 'Descrição',
    valor: 'Valor',
    conservacao: 'Conservação',
    owner_id: 'Responsável',
    sala: 'Sala',
    lastEditedBy: '',
    lastEditedAt: ''
}