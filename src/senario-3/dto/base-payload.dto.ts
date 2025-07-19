
import { IsString } from 'class-validator';

export class BasePayload {
    @IsString()
    id!: string;

    @IsString()
    password!: string;
}
