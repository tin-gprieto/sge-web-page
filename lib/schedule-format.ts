import type { ScheduledClass } from "@/lib/api"

const DEFAULT_DAYS_ORDER = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]

export function formatScheduleForClipboard(
  courses: ScheduledClass[],
  daysOrder: string[] = DEFAULT_DAYS_ORDER
): string {
  let text = "Horario planificado\n"
  text += `${"=".repeat(50)}\n\n`

  daysOrder.forEach((day) => {
    const coursesInDay = courses.filter((course) => course.day === day)
    if (coursesInDay.length === 0) return

    text += `${day}:\n`
    coursesInDay.forEach((course) => {
      text += `  - ${course.subject} (${course.curse_type})\n`
      text += `    Hora: ${course.starts_at}:00 | Aula: ${course.room} | Edificio: ${course.build}\n`
      text += `    Responsables: ${course.responsibles.join(", ") || "N/A"}\n`
    })
    text += "\n"
  })

  return text
}
