import { format, addMinutes, parse, isBefore, isEqual } from "date-fns";

/**
 * Calcula slots disponíveis para uma data e duração
 */
export function getAvailableSlots({ nailPro, appointments, blockedTimes, date, duration }) {
  if (!nailPro || !date) return [];

  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  // Verifica se o dia está disponível
  if (!nailPro.working_days || !nailPro.working_days.includes(dayOfWeek)) {
    return [];
  }

  const workStart = nailPro.work_start || "08:00";
  const workEnd = nailPro.work_end || "18:00";
  const interval = nailPro.slot_interval || 30;

  // Gera todos os slots do dia
  const allSlots = [];
  let current = parse(workStart, "HH:mm", new Date());
  const end = parse(workEnd, "HH:mm", new Date());

  while (isBefore(current, end)) {
    const slotEnd = addMinutes(current, duration);
    if (!isBefore(end, slotEnd) || isEqual(end, slotEnd)) {
      allSlots.push(format(current, "HH:mm"));
    }
    current = addMinutes(current, interval);
  }

  // Filtra agendamentos existentes nessa data
  const dateAppointments = appointments.filter(
    (a) => a.date === date && a.status !== "cancelado"
  );

  // Filtra bloqueios
  const dateBlocks = blockedTimes.filter((b) => {
    if (b.date === date) return true;
    if (b.recurring) {
      const blockDay = new Date(b.date + "T12:00:00").getDay();
      return blockDay === dayOfWeek;
    }
    return false;
  });

  // Remove slots ocupados
  const available = allSlots.filter((slot) => {
    const slotStart = parse(slot, "HH:mm", new Date());
    const slotEnd = addMinutes(slotStart, duration);

    // Verifica conflito com agendamentos
    const hasAppointmentConflict = dateAppointments.some((apt) => {
      const aptStart = parse(apt.time, "HH:mm", new Date());
      const aptEnd = addMinutes(aptStart, apt.duration || 60);
      return isBefore(slotStart, aptEnd) && isBefore(aptStart, slotEnd);
    });

    // Verifica conflito com bloqueios
    const hasBlockConflict = dateBlocks.some((block) => {
      const blockStart = parse(block.start_time, "HH:mm", new Date());
      const blockEnd = parse(block.end_time, "HH:mm", new Date());
      return isBefore(slotStart, blockEnd) && isBefore(blockStart, slotEnd);
    });

    return !hasAppointmentConflict && !hasBlockConflict;
  });

  return available;
}