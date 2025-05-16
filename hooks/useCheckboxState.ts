import { useState, useEffect } from 'react';

export const useCheckboxState = () => {
    const [selectedCheckbox, setSelectedCheckbox] = useState<string>('');
    const [conservacao, setConservacao] = useState<string>('não avaliado');

    const handleCheckboxChange = (value: string) => {
        setSelectedCheckbox((prev) => (prev === value ? '' : value));
    };

    useEffect(() => {
        if (selectedCheckbox === 'bom') setConservacao('bom');
        else if (selectedCheckbox === 'ocioso') setConservacao('ocioso');
        else if (selectedCheckbox === 'irrecuperável') setConservacao('irrecuperável');
        else setConservacao('não avaliado');
    }, [selectedCheckbox]);

    return {
        selectedCheckbox,
        conservacao,
        handleCheckboxChange,
    };
};
