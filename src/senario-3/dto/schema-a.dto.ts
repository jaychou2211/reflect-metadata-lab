import { Type } from 'class-transformer';
import { ArrayMinSize, IsString, ValidateNested } from 'class-validator';
import { BasePayload } from './base-payload.dto';

class PayloadA extends BasePayload {}

export class SchemaADto {
    @IsString()
    shop!: string;

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PayloadA)
    payload!: PayloadA[];
}