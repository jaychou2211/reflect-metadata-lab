
import { Type } from 'class-transformer';
import { ArrayMinSize, IsString, ValidateNested } from 'class-validator';

class PayloadA {
    @IsString()
    id!: string;

    @IsString()
    password!: string;
}

export class SchemaADto {
    @IsString()
    shop!: string;

    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PayloadA)
    payload!: PayloadA[];
}
