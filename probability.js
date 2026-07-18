function combination(n, k) {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result *= (n - k + i);
    result /= i;
  }
  return result;
}

function probability(draws) {
  const total = 150;
  const epicCount = 3;
  const hlCount = 8;
  const normalCount = total - epicCount - hlCount; // 139

  if (draws > 150) draws = 150;

  // 1. Calculate the probability of getting at least 1 Epic
  const failEpic = combination(total - epicCount, draws) / combination(total, draws);
  const epicChance = (1 - failEpic) * 100;

  // 2. Calculate the probability of getting at least 1 Highlight
  const failHl = combination(total - hlCount, draws) / combination(total, draws);
  const hlChance = (1 - failHl) * 100;

  // 3. Calculate the expected number of cards (Expected Value = draws * (count / total))
  // For hypergeometric distribution, the expected value of target cards drawn is simple: draws * (targetCount / total)
  const expectedEpic = Math.round(draws * (epicCount / total));
  const expectedHl = Math.round(draws * (hlCount / total));

  return {
    epicChance: epicChance,
    hlChance: hlChance,
    expectedEpic: expectedEpic,
    expectedHl: expectedHl
  };
}
