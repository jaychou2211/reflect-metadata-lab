
import { Type } from 'class-transformer';
import { ArrayMinSize, IsString, ValidateNested } from 'class-validator';

class PayloadC {
    @IsString()
    id!: string;

    @IsString()
    password!: string;
}

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
