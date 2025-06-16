import React from 'react';
import { useForm } from 'react-hook-form';

export default function test() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const onSubmit = data => console.log(data);
  console.log(errors);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="number" placeholder="Número de patrimonio" {...register("Número de patrimonio", {required: true, maxLength: 10})} />
      <input type="text" placeholder="Número ATM" {...register} />
      <input type="text" placeholder="Descrição" {...register("Descrição", {required: true, maxLength: 100})} />
      <input type="number" placeholder="Valor" {...register("Valor", {required: true, maxLength: 10})} />
      <input type="text" placeholder="Nome do responsável" {...register("Nome do responsável", {required: true, maxLength: 60})} />
      <input type="text" placeholder="Número de sala" {...register("Número de sala", {required: true, maxLength: 8})} />
      <select {...register("Preservação", { required: true })}>
        <option value="Bom">Bom</option>
        <option value="Ocioso">Ocioso</option>
        <option value="Irrecuperável">Irrecuperável</option>
      </select>

      <input type="submit" />
    </form>
  );
}