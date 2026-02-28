export function getDaysRemaining(targetDateStr: string): number {
    const target = new Date(targetDateStr);
    const today = new Date(); // Context today: 2026-02-19
    // Reset time to midnight for accurate day comparison
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(targetDateStr: string, daysThreshold: number = 90): boolean {
    const days = getDaysRemaining(targetDateStr);
    return days <= daysThreshold;
}

export function formatDateBR(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

export function addMonthsToDate(baseDate: Date, months: number): string {
    const defaultDate = new Date(baseDate.getTime());
    defaultDate.setMonth(defaultDate.getMonth() + months);
    return defaultDate.toISOString().split('T')[0];
}

export function maskCPF(value: string): string {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

export function maskPhone(value: string): string {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
}

export function getClassificacaoCalibre(
    calibre: string,
    tipo?: string,
    modelo?: string,
    tipoFuncionamento?: string
): 'Permitido' | 'Restrito' {
    const mod = modelo?.toLowerCase() || '';

    // Espingardas
    // "Espingarda de qualquer calibre semi auto é restrita, de repetição é permitida."
    if (tipo === 'Espingarda' || mod.includes('espingarda')) {
        if (tipoFuncionamento === 'Semi-Auto') return 'Restrito';
        if (tipoFuncionamento === 'Repetição') return 'Permitido';
    }

    // Regras Específicas: Calibre .357 Mag
    // "Revólver no calibre 357 é restrito, Carabina no calibre 357 é permitido"
    if (calibre === '.357 Mag') {
        if (tipo === 'Revólver' || mod.includes('revolver')) return 'Restrito';
        if (tipo === 'Carabina/Fuzil' && mod.includes('carabina')) return 'Permitido';
        // Fuzil 357 não existe praticamente, mas por padrão 357 Mag em arma curta moderna é restrito
        return 'Restrito';
    }

    // Regra Geral dos Calibres
    const permitidos = ['.22 LR', '.380 ACP', '.38 SPL', '12 GA'];
    const restritos = ['9mm', '.40 S&W', '.45 ACP', '.308 Win', '5.56', '7.62'];

    if (permitidos.includes(calibre)) return 'Permitido';
    if (restritos.includes(calibre)) return 'Restrito';

    return 'Permitido'; // Fallback default
}

export function getWeaponLimits(tipoAcervo: string, nivelAtirador?: '1' | '2' | '3'): { permitido: number, restrito: number, total: number } {
    if (tipoAcervo === 'Caçador') {
        return { permitido: 4, restrito: 2, total: 6 };
    }

    if (tipoAcervo === 'Atirador') {
        if (nivelAtirador === '1') return { permitido: 4, restrito: 0, total: 4 };
        if (nivelAtirador === '2') return { permitido: 8, restrito: 0, total: 8 };
        if (nivelAtirador === '3') return { permitido: 12, restrito: 4, total: 16 };
        // Default se nível não foi preenchido ainda
        return { permitido: 4, restrito: 0, total: 4 };
    }

    if (tipoAcervo === 'Colecionador') {
        // Pelo decreto atual, não há um numero exato global rígido no prompt,
        // definir limits bem altos para não travar o sistema.
        return { permitido: 999, restrito: 999, total: 999 };
    }

    return { permitido: 999, restrito: 999, total: 999 };
}
