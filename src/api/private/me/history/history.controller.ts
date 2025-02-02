/*
 * SPDX-FileCopyrightText: 2022 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { HistoryEntryImportDto } from '../../../../history/history-entry-import.dto';
import { HistoryEntryUpdateDto } from '../../../../history/history-entry-update.dto';
import { HistoryEntryDto } from '../../../../history/history-entry.dto';
import { HistoryService } from '../../../../history/history.service';
import { SessionGuard } from '../../../../identity/session.guard';
import { ConsoleLoggerService } from '../../../../logger/console-logger.service';
import { Note } from '../../../../notes/note.entity';
import { User } from '../../../../users/user.entity';
import { GetNoteInterceptor } from '../../../utils/get-note.interceptor';
import { OpenApi } from '../../../utils/openapi.decorator';
import { RequestNote } from '../../../utils/request-note.decorator';
import { RequestUser } from '../../../utils/request-user.decorator';

@UseGuards(SessionGuard)
@OpenApi(401)
@ApiTags('history')
@Controller('/me/history')
export class HistoryController {
  constructor(
    private readonly logger: ConsoleLoggerService,
    private historyService: HistoryService,
  ) {
    this.logger.setContext(HistoryController.name);
  }

  @Get()
  @OpenApi(200, 404)
  async getHistory(@RequestUser() user: User): Promise<HistoryEntryDto[]> {
    const foundEntries = await this.historyService.getEntriesByUser(user);
    return await Promise.all(
      foundEntries.map((entry) => this.historyService.toHistoryEntryDto(entry)),
    );
  }

  @Post()
  @OpenApi(201, 404)
  async setHistory(
    @RequestUser() user: User,
    @Body('history') history: HistoryEntryImportDto[],
  ): Promise<void> {
    await this.historyService.setHistory(user, history);
  }

  @Delete()
  @OpenApi(204, 404)
  async deleteHistory(@RequestUser() user: User): Promise<void> {
    await this.historyService.deleteHistory(user);
  }

  @Put(':noteIdOrAlias')
  @OpenApi(200, 404)
  @UseInterceptors(GetNoteInterceptor)
  async updateHistoryEntry(
    @RequestNote() note: Note,
    @RequestUser() user: User,
    @Body() entryUpdateDto: HistoryEntryUpdateDto,
  ): Promise<HistoryEntryDto> {
    const newEntry = await this.historyService.updateHistoryEntry(
      note,
      user,
      entryUpdateDto,
    );
    return await this.historyService.toHistoryEntryDto(newEntry);
  }

  @Delete(':noteIdOrAlias')
  @OpenApi(204, 404)
  @UseInterceptors(GetNoteInterceptor)
  async deleteHistoryEntry(
    @RequestNote() note: Note,
    @RequestUser() user: User,
  ): Promise<void> {
    await this.historyService.deleteHistoryEntry(note, user);
  }
}
