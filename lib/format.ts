export function formatBudget(
  min: number,
  max: number,
  currency: string
): string {
  const symbol = currency === "USD" ? "$" : "¥";
  if (min === max) return `${symbol}${min.toLocaleString()}`;
  return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "刚刚";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN");
}
