export type TipoClienteOrcamento = "associado" | "naoAssociado";
export type TipoDiaOrcamento = "diasUteis" | "sabado" | "domingoFeriado";

export type ValoresPorPeriodo = {
  diasUteis: number;
  sabado: number;
  domingoFeriado: number;
};

export type CatalogoOrcamentoItem = {
  categoria: string;
  item: string;
  associado: ValoresPorPeriodo;
  naoAssociado: ValoresPorPeriodo;
};

export const CEJAS_ORCAMENTO_CATALOGO: CatalogoOrcamentoItem[] = [
  {
    categoria: "Auditório Eggon João da Silva",
    item: "Diurno - Sala Básica",
    associado: { diasUteis: 960, sabado: 1440, domingoFeriado: 1460 },
    naoAssociado: { diasUteis: 1920, sabado: 2875, domingoFeriado: 2920 }
  },
  {
    categoria: "Auditório Eggon João da Silva",
    item: "Diurno - Sala com Recursos",
    associado: { diasUteis: 2625, sabado: 3470, domingoFeriado: 4150 },
    naoAssociado: { diasUteis: 5250, sabado: 6930, domingoFeriado: 8295 }
  },
  {
    categoria: "Auditório Eggon João da Silva",
    item: "Noturno - Sala Básica",
    associado: { diasUteis: 1260, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 2520, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Auditório Eggon João da Silva",
    item: "Noturno - Sala com Recursos",
    associado: { diasUteis: 2940, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 4200, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Auditório Eggon João da Silva",
    item: "Integral - Sala Básica",
    associado: { diasUteis: 2100, sabado: 4200, domingoFeriado: 4520 },
    naoAssociado: { diasUteis: 4200, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Auditório Eggon João da Silva",
    item: "Integral - Sala com Recursos",
    associado: { diasUteis: 4520, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 0, sabado: 0, domingoFeriado: 0 }
  },

  {
    categoria: "Salão Nobre Pedro Donini",
    item: "Diurno - Sala Básica",
    associado: { diasUteis: 340, sabado: 560, domingoFeriado: 590 },
    naoAssociado: { diasUteis: 670, sabado: 1555, domingoFeriado: 1175 }
  },
  {
    categoria: "Salão Nobre Pedro Donini",
    item: "Diurno - Sala com Recursos",
    associado: { diasUteis: 1370, sabado: 1750, domingoFeriado: 1790 },
    naoAssociado: { diasUteis: 2730, sabado: 3505, domingoFeriado: 3570 }
  },
  {
    categoria: "Salão Nobre Pedro Donini",
    item: "Noturno - Sala Básica",
    associado: { diasUteis: 420, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 850, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Salão Nobre Pedro Donini",
    item: "Noturno - Sala com Recursos",
    associado: { diasUteis: 1470, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 2940, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Salão Nobre Pedro Donini",
    item: "Integral - Sala Básica",
    associado: { diasUteis: 630, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1260, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Salão Nobre Pedro Donini",
    item: "Integral - Sala com Recursos",
    associado: { diasUteis: 2200, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 4410, sabado: 0, domingoFeriado: 0 }
  },

  {
    categoria: "Sala Heinz e Ilse Kolbach / Comércio Varejista",
    item: "Diurno - Sala Básica",
    associado: { diasUteis: 220, sabado: 420, domingoFeriado: 450 },
    naoAssociado: { diasUteis: 450, sabado: 840, domingoFeriado: 905 }
  },
  {
    categoria: "Sala Heinz e Ilse Kolbach / Comércio Varejista",
    item: "Diurno - Sala com Recursos",
    associado: { diasUteis: 550, sabado: 780, domingoFeriado: 810 },
    naoAssociado: { diasUteis: 1100, sabado: 1555, domingoFeriado: 1615 }
  },
  {
    categoria: "Sala Heinz e Ilse Kolbach / Comércio Varejista",
    item: "Noturno - Sala Básica",
    associado: { diasUteis: 250, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 500, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala Heinz e Ilse Kolbach / Comércio Varejista",
    item: "Noturno - Sala com Recursos",
    associado: { diasUteis: 580, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1150, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala Heinz e Ilse Kolbach / Comércio Varejista",
    item: "Integral - Sala Básica",
    associado: { diasUteis: 480, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 950, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala Heinz e Ilse Kolbach / Comércio Varejista",
    item: "Integral - Sala com Recursos",
    associado: { diasUteis: 790, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1580, sabado: 0, domingoFeriado: 0 }
  },

  {
    categoria: "Sala Indústria do Vestuário",
    item: "Diurno - Sala Básica",
    associado: { diasUteis: 275, sabado: 480, domingoFeriado: 515 },
    naoAssociado: { diasUteis: 550, sabado: 945, domingoFeriado: 1030 }
  },
  {
    categoria: "Sala Indústria do Vestuário",
    item: "Diurno - Sala com Recursos",
    associado: { diasUteis: 595, sabado: 830, domingoFeriado: 870 },
    naoAssociado: { diasUteis: 1200, sabado: 1670, domingoFeriado: 1745 }
  },
  {
    categoria: "Sala Indústria do Vestuário",
    item: "Noturno - Sala Básica",
    associado: { diasUteis: 340, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 670, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala Indústria do Vestuário",
    item: "Noturno - Sala com Recursos",
    associado: { diasUteis: 650, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1300, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala Indústria do Vestuário",
    item: "Integral - Sala Básica",
    associado: { diasUteis: 750, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1500, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala Indústria do Vestuário",
    item: "Integral - Sala com Recursos",
    associado: { diasUteis: 1050, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 2100, sabado: 0, domingoFeriado: 0 }
  },

  {
    categoria: "Sala de Reunião Superior",
    item: "Diurno - Sala Básica",
    associado: { diasUteis: 220, sabado: 420, domingoFeriado: 450 },
    naoAssociado: { diasUteis: 450, sabado: 840, domingoFeriado: 905 }
  },
  {
    categoria: "Sala de Reunião Superior",
    item: "Diurno - Sala com Recursos",
    associado: { diasUteis: 500, sabado: 780, domingoFeriado: 810 },
    naoAssociado: { diasUteis: 1000, sabado: 1555, domingoFeriado: 1615 }
  },
  {
    categoria: "Sala de Reunião Superior",
    item: "Noturno - Sala Básica",
    associado: { diasUteis: 250, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 500, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala de Reunião Superior",
    item: "Noturno - Sala com Recursos",
    associado: { diasUteis: 525, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1050, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala de Reunião Superior",
    item: "Integral - Sala Básica",
    associado: { diasUteis: 480, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 950, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Sala de Reunião Superior",
    item: "Integral - Sala com Recursos",
    associado: { diasUteis: 735, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1470, sabado: 0, domingoFeriado: 0 }
  },

  {
    categoria: "Salão de Eventos Superior",
    item: "Diurno - Sala Básica",
    associado: { diasUteis: 340, sabado: 560, domingoFeriado: 590 },
    naoAssociado: { diasUteis: 670, sabado: 1115, domingoFeriado: 1175 }
  },
  {
    categoria: "Salão de Eventos Superior",
    item: "Diurno - Sala com Recursos",
    associado: { diasUteis: 650, sabado: 920, domingoFeriado: 950 },
    naoAssociado: { diasUteis: 1300, sabado: 1825, domingoFeriado: 1890 }
  },
  {
    categoria: "Salão de Eventos Superior",
    item: "Noturno - Sala Básica",
    associado: { diasUteis: 420, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 850, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Salão de Eventos Superior",
    item: "Noturno - Sala com Recursos",
    associado: { diasUteis: 740, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1470, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Salão de Eventos Superior",
    item: "Integral - Sala Básica",
    associado: { diasUteis: 920, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 1830, sabado: 0, domingoFeriado: 0 }
  },
  {
    categoria: "Salão de Eventos Superior",
    item: "Integral - Sala com Recursos",
    associado: { diasUteis: 1155, sabado: 0, domingoFeriado: 0 },
    naoAssociado: { diasUteis: 2310, sabado: 0, domingoFeriado: 0 }
  },

  {
    categoria: "Telão de LED",
    item: "LED Nobre 4x2m - Período",
    associado: { diasUteis: 775, sabado: 775, domingoFeriado: 775 },
    naoAssociado: { diasUteis: 1100, sabado: 1100, domingoFeriado: 1100 }
  },
  {
    categoria: "Telão de LED",
    item: "LED Nobre 4x2m - Diária",
    associado: { diasUteis: 2200, sabado: 2200, domingoFeriado: 2200 },
    naoAssociado: { diasUteis: 3100, sabado: 3100, domingoFeriado: 3100 }
  },
  {
    categoria: "Telão de LED",
    item: "LED Auditório 6x3m - Período",
    associado: { diasUteis: 1325, sabado: 1325, domingoFeriado: 1325 },
    naoAssociado: { diasUteis: 2200, sabado: 2200, domingoFeriado: 2200 }
  },
  {
    categoria: "Telão de LED",
    item: "LED Auditório 6x3m - Diária",
    associado: { diasUteis: 3970, sabado: 3970, domingoFeriado: 3970 },
    naoAssociado: { diasUteis: 5500, sabado: 5500, domingoFeriado: 5500 }
  },

  {
    categoria: "Telão de LED - Eventos gratuitos / Entidades",
    item: "LED Salão Nobre - Período",
    associado: { diasUteis: 285, sabado: 285, domingoFeriado: 285 },
    naoAssociado: { diasUteis: 285, sabado: 285, domingoFeriado: 285 }
  },
  {
    categoria: "Telão de LED - Eventos gratuitos / Entidades",
    item: "LED Salão Nobre - Integral/Diária",
    associado: { diasUteis: 445, sabado: 445, domingoFeriado: 445 },
    naoAssociado: { diasUteis: 445, sabado: 445, domingoFeriado: 445 }
  },
  {
    categoria: "Telão de LED - Eventos gratuitos / Entidades",
    item: "LED Auditório - Período",
    associado: { diasUteis: 330, sabado: 330, domingoFeriado: 330 },
    naoAssociado: { diasUteis: 330, sabado: 330, domingoFeriado: 330 }
  },
  {
    categoria: "Telão de LED - Eventos gratuitos / Entidades",
    item: "LED Auditório - Integral/Diária",
    associado: { diasUteis: 550, sabado: 550, domingoFeriado: 550 },
    naoAssociado: { diasUteis: 550, sabado: 550, domingoFeriado: 550 }
  },

  {
    categoria: "Equipamentos e Copa",
    item: "Água 500ml",
    associado: { diasUteis: 5, sabado: 5, domingoFeriado: 5 },
    naoAssociado: { diasUteis: 5, sabado: 5, domingoFeriado: 5 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Copo de água",
    associado: { diasUteis: 3, sabado: 3, domingoFeriado: 3 },
    naoAssociado: { diasUteis: 3, sabado: 3, domingoFeriado: 3 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Café 1 litro",
    associado: { diasUteis: 18, sabado: 18, domingoFeriado: 18 },
    naoAssociado: { diasUteis: 18, sabado: 18, domingoFeriado: 18 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Projetor",
    associado: { diasUteis: 135, sabado: 135, domingoFeriado: 135 },
    naoAssociado: { diasUteis: 385, sabado: 385, domingoFeriado: 385 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Microfone",
    associado: { diasUteis: 35, sabado: 35, domingoFeriado: 35 },
    naoAssociado: { diasUteis: 100, sabado: 100, domingoFeriado: 100 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Caixa de som",
    associado: { diasUteis: 165, sabado: 165, domingoFeriado: 165 },
    naoAssociado: { diasUteis: 280, sabado: 280, domingoFeriado: 280 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Sonorização Nobre - Associado",
    associado: { diasUteis: 330, sabado: 330, domingoFeriado: 330 },
    naoAssociado: { diasUteis: 985, sabado: 985, domingoFeriado: 985 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Sonorização Nobre - Entidade Gratuito",
    associado: { diasUteis: 315, sabado: 315, domingoFeriado: 315 },
    naoAssociado: { diasUteis: 315, sabado: 315, domingoFeriado: 315 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Sonorização Auditório - Associado",
    associado: { diasUteis: 385, sabado: 385, domingoFeriado: 385 },
    naoAssociado: { diasUteis: 1210, sabado: 1210, domingoFeriado: 1210 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Sonorização Auditório - Entidade Gratuito",
    associado: { diasUteis: 370, sabado: 370, domingoFeriado: 370 },
    naoAssociado: { diasUteis: 370, sabado: 370, domingoFeriado: 370 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Tampão redondo",
    associado: { diasUteis: 14, sabado: 14, domingoFeriado: 14 },
    naoAssociado: { diasUteis: 30, sabado: 30, domingoFeriado: 30 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Toalha Grande",
    associado: { diasUteis: 44, sabado: 44, domingoFeriado: 44 },
    naoAssociado: { diasUteis: 120, sabado: 120, domingoFeriado: 120 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Toalha Pequena",
    associado: { diasUteis: 22, sabado: 22, domingoFeriado: 22 },
    naoAssociado: { diasUteis: 60, sabado: 60, domingoFeriado: 60 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Movimentação de cadeiras - unidade",
    associado: { diasUteis: 4, sabado: 4, domingoFeriado: 4 },
    naoAssociado: { diasUteis: 10, sabado: 10, domingoFeriado: 10 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Movimentação de móveis",
    associado: { diasUteis: 30, sabado: 30, domingoFeriado: 30 },
    naoAssociado: { diasUteis: 30, sabado: 30, domingoFeriado: 30 }
  },
  {
    categoria: "Equipamentos e Copa",
    item: "Aquários - por hora",
    associado: { diasUteis: 50, sabado: 50, domingoFeriado: 50 },
    naoAssociado: { diasUteis: 105, sabado: 105, domingoFeriado: 105 }
  }
];

export function getValorCatalogo(
  item: CatalogoOrcamentoItem,
  tipoCliente: TipoClienteOrcamento,
  tipoDia: TipoDiaOrcamento
): number {
  return item[tipoCliente][tipoDia];
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor || 0);
}
