
import { Type } from 'class-transformer';
import { ArrayMinSize, IsString, IsIn, IsUUID, ValidateNested, IsInt, Min } from 'class-validator';

class PayloadB {
    @IsIn(['COD', 'CREDIT CARD'])
    paymentMethod!: string;

    @IsString()
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
