
// Validadores para produção
export const validators = {
  // Validação de email
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validação de telefone brasileiro
  phone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  },

  // Validação de CPF
  cpf: (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cleaned[9]) !== digit) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    
    return parseInt(cleaned[10]) === digit;
  },

  // Validação de CNPJ
  cnpj: (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '');
    
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weights1[i];
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(cleaned[12]) !== digit) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weights2[i];
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return parseInt(cleaned[13]) === digit;
  },

  // Validação de senha forte
  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validação de URL
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validação de valor monetário
  currency: (value: string): boolean => {
    const cleaned = value.replace(/[R$\s.,]/g, '');
    return !isNaN(Number(cleaned)) && Number(cleaned) >= 0;
  },

  // Validação de data no futuro
  futureDate: (date: string | Date): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d > new Date();
  },

  // Validação de arquivo
  file: (file: File, maxSize: number, allowedTypes: string[]): { isValid: boolean; error?: string } => {
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Máximo permitido: ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      };
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      return {
        isValid: false,
        error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`
      };
    }
    
    return { isValid: true };
  },
};
