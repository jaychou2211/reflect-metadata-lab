import { Type } from 'class-transformer';
import { ArrayMinSize, IsString, ValidateNested } from 'class-validator';
import { BasePayload } from './base-payload.dto';

class PayloadC extends BasePayload {}

export class SchemaCDto {
    @IsString()
    orderId!: string;

    @IsString()
    orderNote!: string;

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PayloadC)
    payload!: PayloadC[];
}