/**
 * Format ISO date string into readable Date and Time formats
 */
export const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

/**
 * Format Date of Birth or date string into DD/MM/YYYY
 */
export const formatDob = (dobString?: string | null): string => {
  if (!dobString) return '—';
  try {
    const raw = dobString.split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dobString);
    if (isNaN(date.getTime())) return dobString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dobString;
  }
};

export const formatDateOnly = (isoString: string): string => {
  return formatDob(isoString);
};

export const formatTimeOnly = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

/**
 * Calculate age accurately in full completed years from a Date of Birth (YYYY-MM-DD or ISO string)
 */
export const calculateAge = (dobString: string): number => {
  if (!dobString) return 0;
  try {
    // Parse YYYY-MM-DD safely without timezone shifts
    const parts = dobString.split('-');
    let birthDate: Date;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;
      birthDate = new Date(year, month, day);
    } else {
      birthDate = new Date(dobString);
    }

    if (isNaN(birthDate.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  } catch {
    return 0;
  }
};
