import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

interface SuccessResponseOptions {
  message: string;
  isArray?: boolean;
  status?: number;
}

interface TypedSuccessResponseOptions {
  message: string;
  model: new () => object;
  isArray?: boolean;
  status?: number;
}

export function ApiSuccessResponse(options: SuccessResponseOptions) {
  const dataSchema = options.isArray
    ? {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
        },
      }
    : {
        type: 'object',
        additionalProperties: true,
      };

  return ApiResponse({
    status: options.status ?? 200,
    description: options.message,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: options.message },
        data: dataSchema,
      },
    },
  });
}

export function ApiTypedSuccessResponse(options: TypedSuccessResponseOptions) {
  const dataSchema = options.isArray
    ? {
        type: 'array',
        items: { $ref: getSchemaPath(options.model) },
      }
    : { $ref: getSchemaPath(options.model) };

  return applyDecorators(
    ApiExtraModels(options.model),
    ApiResponse({
      status: options.status ?? 200,
      description: options.message,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: options.message },
          data: dataSchema,
        },
      },
    }),
  );
}

export function ApiUuidParam(name: string, description: string) {
  return ApiParam({
    name,
    description,
    required: true,
    schema: { type: 'string', format: 'uuid' },
  });
}

export function ApiCommonErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Solicitud invalida' }),
    ApiUnauthorizedResponse({ description: 'No autenticado o token invalido' }),
    ApiForbiddenResponse({ description: 'No tiene permisos para esta accion' }),
    ApiNotFoundResponse({ description: 'Recurso no encontrado' }),
  );
}
