import { Controller, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .default([]),
});

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chat(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const { message, history } = ChatSchema.parse(body);
    const reply = await this.aiService.chat(user.id, message, history);
    return { reply };
  }
}
