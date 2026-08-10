export interface NetWorthData {
  assets: { name: string; value: number; type: string }[];
  liabilities: { name: string; amount: number; type: string }[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export function calculateNetWorth(
  assets: { name: string; value: number; type: string }[],
  liabilities: { name: string; amount: number; type: string }[],
  cashBalance: number,
  reserveBalance: number
): NetWorthData {
  const allAssets = [
    { name: "Operational Cash", value: cashBalance, type: "cash" },
    { name: "Reserve Fund", value: reserveBalance, type: "reserve" },
    ...assets,
  ];

  const totalAssets = allAssets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  return { assets: allAssets, liabilities, totalAssets, totalLiabilities, netWorth };
}
