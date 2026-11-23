export const IST_TIMEZONE = "Asia/Kolkata"

export function nowIST() {
  return new Date()
}

export function startOfDayIST(date: Date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
}

export function formatDateIST(date: Date) {
  const d = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  return d.toISOString().split("T")[0]
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function startOfWeekIST(date: Date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = d.getDate() - day
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

export function endOfWeekIST(date: Date = new Date()) {
  const start = startOfWeekIST(date)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
}
