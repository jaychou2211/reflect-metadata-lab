
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsString, IsInt, Min, Max } from 'class-validator';

class User {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  age!: number;
}

const plainUser = {
  name: 'John Doe',
  age: 30,
};

const user = plainToInstance(User, plainUser);

validate(user).then(errors => {
  if (errors.length > 0) {
    console.log('Validation failed. errors: ', errors);
  } else {
    console.log('Validation succeed. user: ', user);
  }
});

const plainInvalidUser = {
    name: 123,
    age: 200,
};

const invalidUser = plainToInstance(User, plainInvalidUser);

validate(invalidUser).then(errors => {
    if (errors.length > 0) {
        console.log('Validation failed. errors: ', errors);
    } else {
        console.log('Validation succeed. user: ', invalidUser);
    }
});
