
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { SchemaADto } from './schema-a.dto';
import { SchemaBDto } from './schema-b.dto';
import { SchemaCDto } from './schema-c.dto';

export class MainDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => SchemaADto)
    providerA?: SchemaADto | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => SchemaBDto)
    providerB?: SchemaBDto | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => SchemaCDto)
    providerC?: SchemaCDto | null;
}
