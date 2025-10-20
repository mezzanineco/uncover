import type { PasswordRequirements } from '../types/auth';

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met?: boolean;
}

export function generatePasswordRequirements(
  requirements: PasswordRequirements
): PasswordRequirement[] {
  const reqs: PasswordRequirement[] = [];

  reqs.push({
    label: `At least ${requirements.minLength} characters long`,
    test: (pwd) => pwd.length >= requirements.minLength
  });

  if (requirements.requireUppercase) {
    reqs.push({
      label: 'Contains at least one uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd)
    });
  }

  if (requirements.requireLowercase) {
    reqs.push({
      label: 'Contains at least one lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd)
    });
  }

  if (requirements.requireNumber) {
    reqs.push({
      label: 'Contains at least one number',
      test: (pwd) => /[0-9]/.test(pwd)
    });
  }

  if (requirements.requireSpecialChar) {
    reqs.push({
      label: 'Contains at least one special character (!@#$%^&*)',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    });
  }

  return reqs;
}

export function validatePassword(
  password: string,
  requirements: PasswordRequirements
): { isValid: boolean; requirements: PasswordRequirement[] } {
  const reqs = generatePasswordRequirements(requirements);

  const reqsWithStatus = reqs.map(req => ({
    ...req,
    met: req.test(password)
  }));

  const isValid = reqsWithStatus.every(req => req.met);

  return {
    isValid,
    requirements: reqsWithStatus
  };
}

export function getDefaultPasswordRequirements(): PasswordRequirements {
  return {
    id: 'default',
    organisationId: 'default',
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
