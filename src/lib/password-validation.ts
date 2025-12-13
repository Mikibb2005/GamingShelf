/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password) {
        return { isValid: false, errors: ["La contraseña es requerida"] };
    }

    if (password.length < 8) {
        errors.push("La contraseña debe tener al menos 8 caracteres");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("La contraseña debe contener al menos una letra mayúscula");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("La contraseña debe contener al menos una letra minúscula");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("La contraseña debe contener al menos un número");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get a human-readable summary of password requirements
 */
export function getPasswordRequirements(): string {
    return "Mínimo 8 caracteres, con mayúscula, minúscula y número";
}
