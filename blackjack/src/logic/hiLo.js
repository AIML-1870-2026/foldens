export function getHiLoValue(card) {
  const rank = card.rank;
  if (['2', '3', '4', '5', '6'].includes(rank)) return +1;
  if (['7', '8', '9'].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}
