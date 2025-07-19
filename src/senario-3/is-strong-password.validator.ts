
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }
    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }
    // At least one digit
    if (!/[0-9]/.test(password)) {
      return false;
    }
    // At least one special character (e.g., !@#$%^&*)
    if (!/[!@#$%^&*]/.test(password)) {
      return false;
    }
    return true; // password has met all criteria
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (!@#$%^&*).';
  }
}
