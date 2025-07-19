import { Type } from 'class-transformer';
import { ArrayMinSize, IsString, IsIn, IsUUID, ValidateNested, IsInt, Min, Validate } from 'class-validator';
import { BasePayload } from './base-payload.dto';
import { IsStrongPasswordConstraint } from '../is-strong-password.validator';

class PayloadB extends BasePayload {
    @IsIn(['COD', 'CREDIT CARD'])
    paymentMethod!: string;

    // Additional validation for password, IsString() is inherited from BasePayload
    @Validate(IsStrongPasswordConstraint)
    password!: string;

    @IsInt()
    @Min(1)
    count!: number;
}

export class SchemaBDto {
    @IsUUID()
    store!: string;

    @IsIn(['TWD', 'HKD'])
    currency!: string;

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PayloadB)
    payload!: PayloadB[];
}