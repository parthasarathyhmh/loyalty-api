import * as Joi from 'joi';

export function getValidationConfig(): Record<string, any> {
  return Joi.object({
    DATABSE_URL: Joi.string().required(),
    HSF_API_URL: Joi.string().required(),
    HSF_TOKEN: Joi.string().required(),
    LOYALTY_JWT_SECRET: Joi.string().required(),
    LOYALTY_JWT_EXPIRY: Joi.string().required(),
    HSF_MX_M2M_TOKEN: Joi.string().required(),
  });
}
