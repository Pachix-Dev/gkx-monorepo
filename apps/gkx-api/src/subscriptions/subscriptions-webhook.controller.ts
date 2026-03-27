import { Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiCommonErrorResponses,
  ApiSuccessResponse,
} from '../common/swagger/openapi.decorators';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions/webhooks')
export class SubscriptionsWebhookController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('stripe')
  @ApiOperation({
    summary: 'Stripe base webhook for subscription synchronization',
  })
  @ApiSuccessResponse({ message: 'Webhook processed' })
  @ApiCommonErrorResponses()
  async stripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const data = await this.subscriptionsService.processStripeWebhook(
      req.rawBody,
      signature,
    );

    return { success: true, message: 'Webhook processed', data };
  }
}
