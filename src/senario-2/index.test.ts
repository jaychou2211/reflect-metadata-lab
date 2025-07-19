import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { MainDto } from './dto/main.dto'; // Changed from Main2Dto

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
    const instance = plainToInstance(MainDto, payload); // Changed from Main2Dto
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

describe('MainDto Validation Scenarios (Inheritance)', () => { // Changed describe name

    describe('Happy Path Scenarios', () => {
        it('should pass with a valid providerA and others null', async () => {
            const payload = {
                providerA: {
                    shop: 'My Awesome Shop',
                    payload: [{ id: 'prod-1', password: 'pass123' }]
                },
                providerB: null,
                providerC: undefined,
            };
            await (await expectValidation(payload)).toPass();
        });

        it('should pass with valid data for all providers', async () => {
            const payload = {
                providerA: {
                    shop: 'Shop A',
                    payload: [{ id: 'a1', password: 'p1' }]
                },
                providerB: {
                    store: '123e4567-e89b-12d3-a456-426614174000',
                    currency: 'TWD',
                    payload: [{ id: 'b1', password: 'p2', paymentMethod: 'COD', count: 1 }]
                },
                providerC: {
                    orderId: 'order-xyz',
                    orderNote: 'Handle with care',
                    payload: [{ id: 'c1', password: 'p3' }]
                }
            };
            await (await expectValidation(payload)).toPass();
        });

        it('should pass if all providers are null or undefined', async () => {
            const payload = {
                providerA: null,
                providerB: undefined,
                providerC: null
            };
            await (await expectValidation(payload)).toPass();
        });
    });

    describe('Edge Cases & Invalid Data Scenarios', () => {

        it('should fail if a provider has incorrect root property type', async () => {
            const payload = {
                providerA: {
                    shop: 12345, // Invalid type
                    payload: [{ id: 'a', password: 'p' }]
                }
            };
            await (await expectValidation(payload)).toFailWith([
                'shop must be a string'
            ]);
        });

        it('should fail if a nested payload property has incorrect type (inherited)', async () => {
            const payload = {
                providerC: {
                    orderId: 'order-123',
                    orderNote: 'note',
                    payload: [{ id: 'prod-c', password: 999 }] // password should be a string
                }
            };
            await (await expectValidation(payload)).toFailWith([
                'password must be a string'
            ]);
        });

        it('should fail if providerB has invalid UUID', async () => {
            const payload = {
                providerB: {
                    store: 'not-a-uuid', // Invalid UUID
                    currency: 'TWD',
                    payload: [{ id: 'b1', password: 'p' }]
                }
            };
            await (await expectValidation(payload)).toFailWith([
                'store must be a UUID'
            ]);
        });

        it('should fail if providerB has invalid currency', async () => {
            const payload = {
                providerB: {
                    store: '123e4567-e89b-12d3-a456-426614174000',
                    currency: 'USD', // Invalid currency
                    payload: [{ id: 'b1', password: 'p' }]
                }
            };
            await (await expectValidation(payload)).toFailWith([
                'currency must be one of the following values: TWD, HKD'
            ]);
        });

        it('should fail if providerB payload has count less than 1', async () => {
            const payload = {
                providerB: {
                    store: '123e4567-e89b-12d3-a456-426614174000',
                    currency: 'HKD',
                    payload: [{ id: 'b1', password: 'p', paymentMethod: 'CREDIT CARD', count: 0 }] // Invalid count
                }
            };
            await (await expectValidation(payload)).toFailWith([
                'count must not be less than 1'
            ]);
        });

        it('should fail if payload array is empty', async () => {
            const payload = {
                providerA: {
                    shop: 'Empty Payload Shop',
                    payload: []
                }
            };
            await (await expectValidation(payload)).toFailWith([
                'payload must contain at least 1 elements'
            ]);
        });

        it('should fail with multiple errors from multiple providers', async () => {
            const payload = {
                providerA: {
                    shop: null, // Invalid
                    payload: []
                },
                providerB: {
                    store: '123e4567-e89b-12d3-a456-426614174000',
                    currency: 'TWD',
                    payload: [{ id: 'b1', password: 'p', paymentMethod: 'DEBIT', count: 1 }] // Invalid paymentMethod
                }
            };
            await (await expectValidation(payload)).toFailWith([
                'shop must be a string',
                'payload must contain at least 1 elements',
                'paymentMethod must be one of the following values: COD, CREDIT CARD'
            ]);
        });
    });
});