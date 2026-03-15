type Assumptions = Record<string, unknown>;

type ScenarioResult = {
  name: 'Conservative' | 'Realistic' | 'Optimistic';
  totalCost: number;
  grossRevenue: number;
  netRevenue: number;
  netProfit: number;
  profitMargin: number;
};

type CostBreakdown = {
  oneTime: number;
  monthly: number;
  daily: number;
  lengthBased: number;
  quantityBased: number;
  financing: number;
  insurance: number;
};

export type CalculationOutput = {
  totalCost: number;
  grossRevenue: number;
  netRevenue: number;
  netProfit: number;
  profitMargin: number;
  calculatedCosts: {
    breakdown: CostBreakdown;
    assumptionsUsed: Record<string, number | boolean | string>;
  };
  calculatedRevenue: {
    vat: number;
    incomeTax: number;
    scenarios: ScenarioResult[];
    decision: {
      label: 'FEASIBLE' | 'MARGINAL' | 'NOT_FEASIBLE';
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
      message: string;
    };
  };
};

const numberValue = (assumptions: Assumptions, key: string, fallback = 0): number => {
  const raw = assumptions[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    const nested = (raw as { value?: unknown }).value;
    if (typeof nested === 'number' && Number.isFinite(nested)) return nested;
    if (typeof nested === 'string') {
      const parsed = Number(nested);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
};

const booleanValue = (assumptions: Assumptions, key: string, fallback = false): boolean => {
  const raw = assumptions[key];
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') return raw.toLowerCase() === 'true';
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    const nested = (raw as { value?: unknown }).value;
    if (typeof nested === 'boolean') return nested;
    if (typeof nested === 'string') return nested.toLowerCase() === 'true';
  }
  return fallback;
};

const clampPercent = (value: number): number => Math.max(-100, Math.min(100, value));

const nestedNumberValue = (
  assumptions: Assumptions,
  key: string,
  nestedKey: string,
  fallback = Number.NaN
): number => {
  const raw = assumptions[key];
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const nested = (raw as Record<string, unknown>)[nestedKey];
  if (typeof nested === 'number' && Number.isFinite(nested)) {
    return nested;
  }

  if (typeof nested === 'string') {
    const parsed = Number(nested);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const revenueFromDynamicRows = (assumptions: Assumptions) => {
  const raw = assumptions.revenueData;
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as {
    rows?: Array<{ quantity?: unknown; unitRate?: unknown }>;
    settings?: { vatPercent?: unknown; taxPercent?: unknown };
  };

  if (!Array.isArray(data.rows) || data.rows.length === 0) {
    return null;
  }

  const grossRevenue = data.rows.reduce((sum, row) => {
    const quantity = typeof row.quantity === 'number' ? row.quantity : Number(row.quantity ?? 0);
    const unitRate = typeof row.unitRate === 'number' ? row.unitRate : Number(row.unitRate ?? 0);
    const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
    const safeRate = Number.isFinite(unitRate) ? unitRate : 0;
    return sum + safeQuantity * safeRate;
  }, 0);

  const vatPercentRaw = typeof data.settings?.vatPercent === 'number'
    ? data.settings.vatPercent
    : Number(data.settings?.vatPercent ?? Number.NaN);
  const taxPercentRaw = typeof data.settings?.taxPercent === 'number'
    ? data.settings.taxPercent
    : Number(data.settings?.taxPercent ?? Number.NaN);

  const vatPercent = Number.isFinite(vatPercentRaw) ? vatPercentRaw : 10;
  const taxPercent = Number.isFinite(taxPercentRaw) ? taxPercentRaw : 5;
  const vat = grossRevenue * (vatPercent / 100);
  const incomeTax = grossRevenue * (taxPercent / 100);
  const netRevenue = grossRevenue - vat - incomeTax;

  return {
    grossRevenue,
    vat,
    incomeTax,
    netRevenue,
  };
};

const scenarioResult = (name: ScenarioResult['name'], totalCost: number, grossRevenue: number): ScenarioResult => {
  const netRevenue = grossRevenue * 0.85;
  const netProfit = netRevenue - totalCost;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    name,
    totalCost: round2(totalCost),
    grossRevenue: round2(grossRevenue),
    netRevenue: round2(netRevenue),
    netProfit: round2(netProfit),
    profitMargin: round2(profitMargin),
  };
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const decisionFromMargin = (margin: number): CalculationOutput['calculatedRevenue']['decision'] => {
  if (margin >= 15) {
    return {
      label: 'FEASIBLE',
      confidence: 'HIGH',
      message: 'Profitability is strong in realistic scenario.',
    };
  }

  if (margin >= 10) {
    return {
      label: 'MARGINAL',
      confidence: 'MEDIUM',
      message: 'Margin is acceptable but sensitive to cost or price changes.',
    };
  }

  return {
    label: 'NOT_FEASIBLE',
    confidence: 'LOW',
    message: 'Profit margin is below target threshold.',
  };
};

const calculateFiber = (assumptions: Assumptions): CalculationOutput => {
  const undergroundLength = numberValue(assumptions, 'underground_length', numberValue(assumptions, 'total_underground_length', 0));
  const overheadLength = numberValue(assumptions, 'overhead_length', 0);
  const numberOfLinks = numberValue(assumptions, 'number_of_links', 10);
  const numberOfBridges = numberValue(assumptions, 'number_of_bridges', 0);
  const numberOfCulverts = numberValue(assumptions, 'number_of_culverts', 0);
  const numberOfRivers = numberValue(assumptions, 'number_of_rivers', 0);
  const durationMonths = Math.max(1, Math.round(numberValue(assumptions, 'project_duration_months', Math.ceil(Math.max(1, undergroundLength) / 10000))));

  const cablesProvidedByClient = booleanValue(assumptions, 'cables_provided_by_client', false);
  const ductsProvidedByClient = booleanValue(assumptions, 'ducts_provided_by_client', false);

  const workingDays = durationMonths * 24;
  const numberOfSites = undergroundLength > 50000 ? 3 : 2;
  const hddMachines = undergroundLength > 40000 ? 2 : 1;
  const totalVerticalMeters = numberOfLinks * 80;
  const totalCores = numberOfLinks * 52;
  const totalHandHoles = Math.ceil(undergroundLength / 200) + Math.ceil(undergroundLength / 1000);

  const oneTimeBase =
    numberOfSites * 7000 +
    20000 +
    30000 +
    50000 +
    20000 +
    30000 +
    50000 +
    5000 +
    3000 +
    numberOfBridges * 60000 +
    numberOfCulverts * 20000 +
    numberOfRivers * 100000;

  const monthly =
    durationMonths *
    (hddMachines * 500000 +
      10000 +
      15000 +
      15000 +
      40000 +
      40000 +
      25000 +
      15000 +
      30000 +
      6000 +
      2500 +
      5000 +
      25000 +
      5000 +
      3000 +
      20000);

  const daily = workingDays * (10 * 1000 + 1000 + 5000 + 2000 + 2500 + 1000);

  const lengthBased =
    undergroundLength *
    ((cablesProvidedByClient ? 0 : 18) + (ductsProvidedByClient ? 0 : 30) + 5 + 1 + 0.5 + 40);

  const quantityBased =
    totalHandHoles * 15000 +
    numberOfLinks * 4 * 110 +
    numberOfLinks * 2700 +
    totalCores * 50 +
    Math.ceil(numberOfLinks / 2) * 2000 +
    Math.ceil(numberOfLinks / 4) * 7000;

  const financing = 2000000 * 0.14 * (durationMonths / 12);
  const capexSummaryTotal = nestedNumberValue(assumptions, 'capexSummary', 'total');
  const opexSummaryTotal = nestedNumberValue(assumptions, 'opexSummary', 'total');
  const useStepTotals = Number.isFinite(capexSummaryTotal) || Number.isFinite(opexSummaryTotal);

  const oneTimeCost = useStepTotals
    ? (Number.isFinite(capexSummaryTotal) ? capexSummaryTotal : oneTimeBase + lengthBased + quantityBased)
    : oneTimeBase;
  const monthlyCost = useStepTotals
    ? (Number.isFinite(opexSummaryTotal) ? opexSummaryTotal : monthly + daily)
    : monthly;
  const dailyCost = useStepTotals ? 0 : daily;
  const lengthBasedCost = useStepTotals ? 0 : lengthBased;
  const quantityBasedCost = useStepTotals ? 0 : quantityBased;

  const beforeInsurance = oneTimeCost + monthlyCost + dailyCost + lengthBasedCost + quantityBasedCost + financing;
  const insurance = beforeInsurance * 0.01;
  const totalCost = beforeInsurance + insurance;

  const dynamicRevenue = revenueFromDynamicRows(assumptions);
  const legacyGrossRevenue = undergroundLength * 250 + totalVerticalMeters * 180 + totalCores * 70 + overheadLength * 120;
  const revenueSummaryGross = nestedNumberValue(assumptions, 'revenueSummary', 'grossTotal');
  const grossRevenue = dynamicRevenue
    ? dynamicRevenue.grossRevenue
    : Number.isFinite(revenueSummaryGross)
      ? revenueSummaryGross
      : legacyGrossRevenue;

  const revenueSummaryVat = nestedNumberValue(assumptions, 'revenueSummary', 'vatAmount');
  const revenueSummaryTax = nestedNumberValue(assumptions, 'revenueSummary', 'taxAmount');
  const revenueSummaryNet = nestedNumberValue(assumptions, 'revenueSummary', 'netReceivable');

  const vatPercent = numberValue(assumptions, 'vat_percentage', 10);
  const taxPercent = numberValue(assumptions, 'income_tax_percentage', 5);

  const vat = dynamicRevenue
    ? dynamicRevenue.vat
    : Number.isFinite(revenueSummaryVat)
      ? revenueSummaryVat
      : grossRevenue * (vatPercent / 100);
  const incomeTax = dynamicRevenue
    ? dynamicRevenue.incomeTax
    : Number.isFinite(revenueSummaryTax)
      ? revenueSummaryTax
      : grossRevenue * (taxPercent / 100);
  const netRevenue = dynamicRevenue
    ? dynamicRevenue.netRevenue
    : Number.isFinite(revenueSummaryNet)
      ? revenueSummaryNet
      : grossRevenue - vat - incomeTax;
  const netProfit = netRevenue - totalCost;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  const scenarios: ScenarioResult[] = [
    scenarioResult('Conservative', totalCost * 1.1, grossRevenue * 0.95),
    scenarioResult('Realistic', totalCost, grossRevenue),
    scenarioResult('Optimistic', totalCost * 0.95, grossRevenue),
  ];

  return {
    totalCost: round2(totalCost),
    grossRevenue: round2(grossRevenue),
    netRevenue: round2(netRevenue),
    netProfit: round2(netProfit),
    profitMargin: round2(clampPercent(profitMargin)),
    calculatedCosts: {
      breakdown: {
        oneTime: round2(oneTimeCost),
        monthly: round2(monthlyCost),
        daily: round2(dailyCost),
        lengthBased: round2(lengthBasedCost),
        quantityBased: round2(quantityBasedCost),
        financing: round2(financing),
        insurance: round2(insurance),
      },
      assumptionsUsed: {
        undergroundLength,
        overheadLength,
        numberOfLinks,
        durationMonths,
        workingDays,
        numberOfSites,
        hddMachines,
        cablesProvidedByClient,
        ductsProvidedByClient,
      },
    },
    calculatedRevenue: {
      vat: round2(vat),
      incomeTax: round2(incomeTax),
      scenarios,
      decision: decisionFromMargin(profitMargin),
    },
  };
};

const calculateTower = (assumptions: Assumptions): CalculationOutput => {
  const numberOfTowers = Math.max(1, Math.round(numberValue(assumptions, 'number_of_towers', 1)));
  const durationMonths = Math.max(1, Math.round(numberValue(assumptions, 'project_duration_months', Math.ceil(numberOfTowers / 10))));
  const requiresPowerUpgrade = booleanValue(assumptions, 'requires_power_upgrade', true);
  const requiresMicrowaveUpgrade = booleanValue(assumptions, 'requires_microwave_upgrade', true);
  const requiresAntennaUpgrade = booleanValue(assumptions, 'requires_antenna_upgrade', true);
  const includesTesting = booleanValue(assumptions, 'includes_testing_commissioning', true);

  const teams = Math.max(2, Math.ceil(numberOfTowers / Math.max(1, durationMonths * 10)));
  const climbers = teams * 2;
  const workingDays = durationMonths * 24;

  const oneTime =
    teams * 15000 +
    climbers * 5000 +
    50000 +
    30000 +
    20000 +
    numberOfTowers * 500 +
    25000;

  const equipmentPerTower =
    (requiresPowerUpgrade ? 45000 : 0) +
    (requiresMicrowaveUpgrade ? 150000 : 0) +
    (requiresAntennaUpgrade ? 35000 : 0) +
    15000 +
    8000 +
    (includesTesting ? 2000 : 0);
  const quantityBased = numberOfTowers * equipmentPerTower;

  const monthly =
    durationMonths *
    (Math.ceil(numberOfTowers / 30) * 2 * 60000 +
      teams * 45000 +
      80000 +
      40000 +
      35000 +
      30000 +
      15000 +
      20000 +
      25000);

  const daily =
    workingDays *
    (climbers * 3500 + Math.ceil(climbers * 0.5) * 1500 + teams * 1200 + teams * 6000 + teams * 2500 + 3000 + 1000);

  const perTowerInstallation =
    numberOfTowers *
    ((requiresPowerUpgrade ? 12000 : 0) +
      (requiresMicrowaveUpgrade ? 25000 : 0) +
      (requiresAntennaUpgrade ? 18000 : 0) +
      8000 +
      (includesTesting ? 15000 : 0) +
      5000);

  const financing = (oneTime + quantityBased) * 0.14 * (durationMonths / 12);
  const capexSummaryTotal = nestedNumberValue(assumptions, 'capexSummary', 'total');
  const opexSummaryTotal = nestedNumberValue(assumptions, 'opexSummary', 'total');
  const useStepTotals = Number.isFinite(capexSummaryTotal) || Number.isFinite(opexSummaryTotal);

  const oneTimeCost = useStepTotals
    ? (Number.isFinite(capexSummaryTotal) ? capexSummaryTotal : oneTime + quantityBased + perTowerInstallation)
    : (oneTime + quantityBased + perTowerInstallation);
  const monthlyCost = useStepTotals
    ? (Number.isFinite(opexSummaryTotal) ? opexSummaryTotal : monthly + daily)
    : monthly;
  const dailyCost = useStepTotals ? 0 : daily;

  const insurance = (oneTimeCost + monthlyCost + dailyCost + financing) * 0.02;

  const totalCost = oneTimeCost + monthlyCost + dailyCost + financing + insurance;

  const dynamicRevenue = revenueFromDynamicRows(assumptions);
  const towerRevenue =
    90000 +
    (requiresPowerUpgrade ? 15000 : 0) +
    (requiresMicrowaveUpgrade ? 30000 : 0) +
    (requiresAntennaUpgrade ? 20000 : 0) +
    (includesTesting ? 18000 : 0);
  const legacyGrossRevenue = numberOfTowers * towerRevenue;
  const revenueSummaryGross = nestedNumberValue(assumptions, 'revenueSummary', 'grossTotal');
  const grossRevenue = dynamicRevenue
    ? dynamicRevenue.grossRevenue
    : Number.isFinite(revenueSummaryGross)
      ? revenueSummaryGross
      : legacyGrossRevenue;

  const revenueSummaryVat = nestedNumberValue(assumptions, 'revenueSummary', 'vatAmount');
  const revenueSummaryTax = nestedNumberValue(assumptions, 'revenueSummary', 'taxAmount');
  const revenueSummaryNet = nestedNumberValue(assumptions, 'revenueSummary', 'netReceivable');

  const vatPercent = numberValue(assumptions, 'vat_percentage', 10);
  const taxPercent = numberValue(assumptions, 'income_tax_percentage', 5);

  const vat = dynamicRevenue
    ? dynamicRevenue.vat
    : Number.isFinite(revenueSummaryVat)
      ? revenueSummaryVat
      : grossRevenue * (vatPercent / 100);
  const incomeTax = dynamicRevenue
    ? dynamicRevenue.incomeTax
    : Number.isFinite(revenueSummaryTax)
      ? revenueSummaryTax
      : grossRevenue * (taxPercent / 100);
  const netRevenue = dynamicRevenue
    ? dynamicRevenue.netRevenue
    : Number.isFinite(revenueSummaryNet)
      ? revenueSummaryNet
      : grossRevenue - vat - incomeTax;
  const netProfit = netRevenue - totalCost;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  const scenarios: ScenarioResult[] = [
    scenarioResult('Conservative', totalCost * 1.1, grossRevenue * 0.95),
    scenarioResult('Realistic', totalCost, grossRevenue),
    scenarioResult('Optimistic', totalCost * 0.95, grossRevenue),
  ];

  return {
    totalCost: round2(totalCost),
    grossRevenue: round2(grossRevenue),
    netRevenue: round2(netRevenue),
    netProfit: round2(netProfit),
    profitMargin: round2(clampPercent(profitMargin)),
    calculatedCosts: {
      breakdown: {
        oneTime: round2(oneTimeCost),
        monthly: round2(monthlyCost),
        daily: round2(dailyCost),
        lengthBased: 0,
        quantityBased: useStepTotals ? 0 : round2(quantityBased + perTowerInstallation),
        financing: round2(financing),
        insurance: round2(insurance),
      },
      assumptionsUsed: {
        numberOfTowers,
        durationMonths,
        teams,
        climbers,
        workingDays,
        requiresPowerUpgrade,
        requiresMicrowaveUpgrade,
        requiresAntennaUpgrade,
        includesTesting,
      },
    },
    calculatedRevenue: {
      vat: round2(vat),
      incomeTax: round2(incomeTax),
      scenarios,
      decision: decisionFromMargin(profitMargin),
    },
  };
};

export function calculateProjectFeasibility(templateCode: string, assumptions: Assumptions): CalculationOutput {
  if (templateCode === '5G_TOWER_CONVERSION' || templateCode === '5G_TOWER') {
    return calculateTower(assumptions);
  }

  return calculateFiber(assumptions);
}
