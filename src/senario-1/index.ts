

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MainDto } from './dto/main.dto';

// 1. A valid case
const validPayload = {
    providerA: {
        shop: 'My Shop',
        payload: [
            { id: 'a', password: '123' },
            { id: 'b', password: '456' },
        ]
    },
    providerB: null, // providerB is optional
};

// 2. An invalid case
const invalidPayload = {
    providerA: {
        shop: 123, // should be a string
        payload: [
            { id: 'a', password: '123' },
            { id: 'b', password: '456' },
        ]
    },
    providerC: {
        orderId: 'order-1',
        orderNote: 'some note',
        payload: [
            { id: 'c', password: 123 } // password should be a string
        ]
    }
};


async function runValidation() {
    console.log('--- Running Validation for Valid Payload ---');
    const validInstance = plainToInstance(MainDto, validPayload);
    let errors = await validate(validInstance);
    if (errors.length > 0) {
        console.log('Validation failed. errors: ', JSON.stringify(errors, null, 2));
    } else {
        console.log('Validation succeed. ');
    }

    console.log('\n--- Running Validation for Invalid Payload ---');
    const invalidInstance = plainToInstance(MainDto, invalidPayload);
    errors = await validate(invalidInstance);
    if (errors.length > 0) {
        console.log('Validation failed. errors: ', JSON.stringify(errors, null, 2));
    } else {
        console.log('Validation succeed.');
    }
}

runValidation();

