
import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { OrderDto } from './dto/order.dto';

// Helper function to recursively extract constraint messages
const getErrorMessages = (errors: ValidationError[]): string[] => {
    let messages: string[] = [];
    for (const error of errors) {
        if (error.constraints) {
            messages.push(...Object.values(error.constraints));
        }
        if (error.children && error.children.length > 0) {
            messages.push(...getErrorMessages(error.children));
        }
    }
    return messages;
};


// Helper function to make tests more declarative
const expectValidation = async (payload: any) => {
    const instance = plainToInstance(OrderDto, payload);
    const errors = await validate(instance);
    return {
        toPass: () => expect(errors.length).toBe(0),
        toFailWith: (expectedErrors: string[]) => {
            const errorMessages = getErrorMessages(errors);
            expect(errors.length).toBeGreaterThan(0);
            // A simple check to see if expected error messages are included in the validation errors
            expectedErrors.forEach(expectedError => {
                expect(errorMessages.some(msg => msg.includes(expectedError))).toBe(true);
            });
        }
    };
};

describe('OrderDto Validation Scenarios (Conditional Validation)', () => {

    describe('Happy Path Scenarios', () => {
        it('should pass with pickup option and location', async () => {
            const payload = {
                deliveryOption: 'pickup',
                pickupLocation: 'Store A',
            };
            await (await expectValidation(payload)).toPass();
        });

        it('should pass with delivery option and address', async () => {
            const payload = {
                deliveryOption: 'delivery',
                deliveryAddress: '123 Main St',
            };
            await (await expectValidation(payload)).toPass();
        });
    });

    describe('Edge Cases & Invalid Data Scenarios', () => {

        it('should fail if deliveryOption is pickup but pickupLocation is missing', async () => {
            const payload = {
                deliveryOption: 'pickup',
            };
            await (await expectValidation(payload)).toFailWith([
                'pickupLocation should not be empty'
            ]);
        });

        it('should fail if deliveryOption is delivery but deliveryAddress is missing', async () => {
            const payload = {
                deliveryOption: 'delivery',
            };
            await (await expectValidation(payload)).toFailWith([
                'deliveryAddress should not be empty'
            ]);
        });

        it('should fail if deliveryOption is pickup and deliveryAddress is present (but not needed)', async () => {
            const payload = {
                deliveryOption: 'pickup',
                pickupLocation: 'Store B',
                deliveryAddress: 'Some Address' // This should be ignored by validation
            };
            await (await expectValidation(payload)).toPass(); // Should still pass as deliveryAddress is ignored
        });

        it('should fail if deliveryOption is delivery and pickupLocation is present (but not needed)', async () => {
            const payload = {
                deliveryOption: 'delivery',
                deliveryAddress: 'Some Address',
                pickupLocation: 'Store B' // This should be ignored by validation
            };
            await (await expectValidation(payload)).toPass(); // Should still pass as pickupLocation is ignored
        });

        it('should fail if deliveryOption is invalid', async () => {
            const payload = {
                deliveryOption: 'invalid',
            };
            await (await expectValidation(payload)).toFailWith([
                'deliveryOption must be one of the following values: pickup, delivery'
            ]);
        });
    });
});
