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

  // 1. คำนวณความน่าจะเป็นที่จะได้ Epic อย่างน้อย 1 ใบ
  const failEpic = combination(total - epicCount, draws) / combination(total, draws);
  const epicChance = (1 - failEpic) * 100;

  // 2. คำนวณความน่าจะเป็นที่จะได้ Highlight อย่างน้อย 1 ใบ
  const failHl = combination(total - hlCount, draws) / combination(total, draws);
  const hlChance = (1 - failHl) * 100;

  // 3. คำนวณจำนวนการ์ดเฉลี่ยที่คาดว่าจะได้ (Expected Value = n * (สูตรสุ่มแบบไม่ใส่คืน))
  // ในทางสถิติการสุ่มแบบ Hypergeometric ค่าเฉลี่ยการ์ดที่จะได้คือ = draws * (จำนวนการ์ดชนิดนั้น / 150)
  const expectedEpic = Math.round(draws * (epicCount / total));
  const expectedHl = Math.round(draws * (hlCount / total));

  return {
    epicChance: epicChance,
    hlChance: hlChance,
    expectedEpic: expectedEpic,
    expectedHl: expectedHl
  };
}