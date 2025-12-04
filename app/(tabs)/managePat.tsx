import ManagePatScreenContent from '@/components/ManagePatScreenContent';

export default function ManagePatTab() {
  // Simplesmente renderiza o conteúdo.
  // Como é uma aba, não passamos parâmetros, então ele assumirá mode='add' internamente.
  return <ManagePatScreenContent />;
}