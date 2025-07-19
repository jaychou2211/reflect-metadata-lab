
import { IsString, IsIn, ValidateIf, IsNotEmpty } from 'class-validator';

export class OrderDto {
    @IsString()
    @IsIn(['pickup', 'delivery'])
    deliveryOption!: 'pickup' | 'delivery';

    @ValidateIf(o => o.deliveryOption === 'pickup')
    @IsString()
    @IsNotEmpty()
    pickupLocation?: string;

    @ValidateIf(o => o.deliveryOption === 'delivery')
    @IsString()
    @IsNotEmpty()
    deliveryAddress?: string;
}
