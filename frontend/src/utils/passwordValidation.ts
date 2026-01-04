/**
 * Validates password strength:
 * - At least 8 characters
 * - At least 1 special symbol
 * - At least 1 capital letter
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: "Parolei jābūt vismaz 8 simbolu garai" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Parolei jāsatur vismaz viens lielais burts" };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: "Parolei jāsatur vismaz viens speciālais simbols" };
  }
  
  return { isValid: true };
}

