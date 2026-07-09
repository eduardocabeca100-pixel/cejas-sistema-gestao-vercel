export function MiniCalendar() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();

  const celulas: Array<{ dia: number; atual: boolean; hoje: boolean }> = [];

  for (let i = primeiroDiaSemana - 1; i >= 0; i -= 1) {
    celulas.push({ dia: diasMesAnterior - i, atual: false, hoje: false });
  }
  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    celulas.push({ dia, atual: true, hoje: dia === hoje.getDate() });
  }
  while (celulas.length % 7 !== 0) {
    celulas.push({ dia: celulas.length - (primeiroDiaSemana + diasNoMes) + 1, atual: false, hoje: false });
  }

  return (
    <div className="mini-calendar">
      {celulas.map((celula, index) => (
        <span key={index} className={[!celula.atual ? "muted" : "", celula.hoje ? "selected" : ""].filter(Boolean).join(" ")}>
          {celula.dia}
        </span>
      ))}
    </div>
  );
}
