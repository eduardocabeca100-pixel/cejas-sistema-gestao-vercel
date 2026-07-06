export function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}
export function todayISO() { return new Date().toISOString().slice(0, 10); }
