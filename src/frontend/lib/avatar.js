export function getInitials(name) {
  if (!name || !name.trim()) return null;
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}