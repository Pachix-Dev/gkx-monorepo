import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Repository } from 'typeorm';
import {
  AttendanceEntity,
  AttendanceStatus,
} from '../attendance/attendance.entity';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { EvaluationEntity } from '../evaluations/evaluation.entity';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TeamEntity } from '../teams/team.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';

const PRIMARY = rgb(0.78, 0.97, 0.01);
const DARK = rgb(0.08, 0.08, 0.08);
const MUTED = rgb(0.45, 0.45, 0.45);
const WHITE = rgb(1, 1, 1);
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 36;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
  ) {}

  async generateGoalkeeperReport(
    goalkeeperId: string,
    from: string | undefined,
    to: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<Uint8Array> {
    const goalkeeper = await this.goalkeepersRepository.findOne({
      where: { id: goalkeeperId },
    });
    if (!goalkeeper) throw new NotFoundException('Goalkeeper not found');

    this.assertTenantAccess(goalkeeper.tenantId, actor);

    const [attendance, evaluations] = await Promise.all([
      this.attendanceRepository.find({
        where: { tenantId: goalkeeper.tenantId, goalkeeperId },
        order: { recordedAt: 'DESC' },
      }),
      this.evaluationsRepository.find({
        where: { tenantId: goalkeeper.tenantId, goalkeeperId },
        order: { evaluationDate: 'DESC' },
      }),
    ]);

    const filteredAttendance = this.filterAttendanceByDate(
      attendance,
      from,
      to,
    );
    const filteredEvaluations = this.filterEvaluationsByDate(
      evaluations,
      from,
      to,
    );

    const present = filteredAttendance.filter(
      (item) => item.status === AttendanceStatus.PRESENT,
    ).length;

    const attendanceRate =
      filteredAttendance.length > 0
        ? Math.round((present / filteredAttendance.length) * 100)
        : 0;

    const avgScore =
      filteredEvaluations.length > 0
        ? Math.round(
            (filteredEvaluations.reduce(
              (sum, item) => sum + Number(item.overallScore ?? 0),
              0,
            ) /
              filteredEvaluations.length) *
              10,
          ) / 10
        : null;

    const pdf = await PDFDocument.create();
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
    const page = pdf.addPage([PAGE_W, PAGE_H]);

    let y = PAGE_H - MARGIN;

    page.drawRectangle({
      x: 0,
      y: PAGE_H - 60,
      width: PAGE_W,
      height: 60,
      color: DARK,
    });
    page.drawText('GKX - Goalkeeper Performance Report', {
      x: MARGIN,
      y: PAGE_H - 38,
      size: 14,
      font: boldFont,
      color: PRIMARY,
    });
    page.drawText(new Date().toLocaleDateString('es-ES'), {
      x: PAGE_W - 100,
      y: PAGE_H - 38,
      size: 9,
      font: bodyFont,
      color: WHITE,
    });

    y = PAGE_H - 80;

    this.drawSectionTitle(page, boldFont, 'Goalkeeper', y);
    y -= 20;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Name',
      goalkeeper.name ?? goalkeeper.id,
      y,
    );
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Period',
      `${from ?? '-'} to ${to ?? '-'}`,
      y,
    );
    y -= 24;

    this.drawSectionTitle(page, boldFont, 'Summary', y);
    y -= 20;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Attendance records',
      String(filteredAttendance.length),
      y,
    );
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Present sessions',
      `${present} (${attendanceRate}%)`,
      y,
    );
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Evaluations',
      String(filteredEvaluations.length),
      y,
    );
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Average score',
      avgScore != null ? String(avgScore) : '-',
      y,
    );
    y -= 24;

    if (filteredEvaluations.length > 0) {
      this.drawSectionTitle(page, boldFont, 'Recent Evaluations', y);
      y -= 20;
      const headers = ['Date', 'Score', 'Comment'];
      const widths = [120, 80, PAGE_W - MARGIN * 2 - 200];
      this.drawTableHeader(page, boldFont, headers, widths, y);
      y -= 18;

      for (const item of filteredEvaluations.slice(0, 14)) {
        if (y < 80) break;
        this.drawTableRow(
          page,
          bodyFont,
          [
            item.evaluationDate,
            String(item.overallScore ?? '-'),
            this.truncate(item.generalComment ?? '', 60),
          ],
          widths,
          y,
        );
        y -= 16;
      }
    }

    return pdf.save();
  }

  async generateTeamReport(
    teamId: string,
    from: string | undefined,
    to: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<Uint8Array> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    this.assertTenantAccess(team.tenantId, actor);

    const sessions = await this.sessionsRepository.find({
      where: { tenantId: team.tenantId, teamId },
      order: { date: 'DESC' },
    });

    const filtered = this.filterSessionsByDate(sessions, from, to);
    const sessionIds = filtered.map((item) => item.id);

    const attendance =
      sessionIds.length > 0
        ? await this.attendanceRepository
            .createQueryBuilder('a')
            .where('a.trainingSessionId IN (:...ids)', { ids: sessionIds })
            .getMany()
        : [];

    const present = attendance.filter(
      (item) => item.status === AttendanceStatus.PRESENT,
    ).length;
    const attendanceRate =
      attendance.length > 0
        ? Math.round((present / attendance.length) * 100)
        : 0;

    const pdf = await PDFDocument.create();
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
    const page = pdf.addPage([PAGE_W, PAGE_H]);

    let y = PAGE_H - MARGIN;

    page.drawRectangle({
      x: 0,
      y: PAGE_H - 60,
      width: PAGE_W,
      height: 60,
      color: DARK,
    });
    page.drawText('GKX - Team Season Summary', {
      x: MARGIN,
      y: PAGE_H - 38,
      size: 14,
      font: boldFont,
      color: PRIMARY,
    });

    y = PAGE_H - 80;

    this.drawSectionTitle(page, boldFont, 'Team', y);
    y -= 20;
    this.drawKV(page, bodyFont, boldFont, 'Name', team.name, y);
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Period',
      `${from ?? '-'} to ${to ?? '-'}`,
      y,
    );
    y -= 24;

    this.drawSectionTitle(page, boldFont, 'Summary', y);
    y -= 20;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Total sessions',
      String(filtered.length),
      y,
    );
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Attendance records',
      String(attendance.length),
      y,
    );
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Attendance rate',
      `${attendanceRate}%`,
      y,
    );
    y -= 24;

    if (filtered.length > 0) {
      this.drawSectionTitle(page, boldFont, 'Recent Sessions', y);
      y -= 20;
      const headers = ['Date', 'Title', 'Status'];
      const widths = [80, PAGE_W - MARGIN * 2 - 160, 80];
      this.drawTableHeader(page, boldFont, headers, widths, y);
      y -= 18;

      for (const item of filtered.slice(0, 18)) {
        if (y < 80) break;
        this.drawTableRow(
          page,
          bodyFont,
          [item.date, this.truncate(item.title, 50), item.status],
          widths,
          y,
        );
        y -= 16;
      }
    }

    return pdf.save();
  }

  async generateSessionReport(
    sessionId: string,
    actor: AuthenticatedUser,
  ): Promise<Uint8Array> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Training session not found');

    this.assertTenantAccess(session.tenantId, actor);

    const [attendance, evaluations] = await Promise.all([
      this.attendanceRepository.find({
        where: { trainingSessionId: sessionId },
        order: { createdAt: 'ASC' },
      }),
      this.evaluationsRepository.find({
        where: { trainingSessionId: sessionId },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const present = attendance.filter(
      (item) => item.status === AttendanceStatus.PRESENT,
    ).length;
    const attendanceRate =
      attendance.length > 0
        ? Math.round((present / attendance.length) * 100)
        : 0;

    const pdf = await PDFDocument.create();
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
    const page = pdf.addPage([PAGE_W, PAGE_H]);

    let y = PAGE_H - MARGIN;

    page.drawRectangle({
      x: 0,
      y: PAGE_H - 60,
      width: PAGE_W,
      height: 60,
      color: DARK,
    });
    page.drawText('GKX - Training Session Report', {
      x: MARGIN,
      y: PAGE_H - 38,
      size: 14,
      font: boldFont,
      color: PRIMARY,
    });

    y = PAGE_H - 80;

    this.drawSectionTitle(page, boldFont, 'Session', y);
    y -= 20;
    this.drawKV(page, bodyFont, boldFont, 'Title', session.title, y);
    y -= 16;
    this.drawKV(page, bodyFont, boldFont, 'Date', session.date, y);
    y -= 16;
    this.drawKV(page, bodyFont, boldFont, 'Status', session.status, y);
    y -= 24;

    this.drawSectionTitle(page, boldFont, 'Attendance', y);
    y -= 20;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Records',
      String(attendance.length),
      y,
    );
    y -= 16;
    this.drawKV(
      page,
      bodyFont,
      boldFont,
      'Present',
      `${present} (${attendanceRate}%)`,
      y,
    );
    y -= 24;

    if (evaluations.length > 0) {
      this.drawSectionTitle(page, boldFont, 'Evaluations', y);
      y -= 20;
      const headers = ['Goalkeeper', 'Score', 'Comment'];
      const widths = [160, 80, PAGE_W - MARGIN * 2 - 240];
      this.drawTableHeader(page, boldFont, headers, widths, y);
      y -= 18;

      for (const item of evaluations.slice(0, 10)) {
        if (y < 80) break;
        this.drawTableRow(
          page,
          bodyFont,
          [
            this.truncate(item.goalkeeperId, 24),
            String(item.overallScore ?? '-'),
            this.truncate(item.generalComment ?? '', 40),
          ],
          widths,
          y,
        );
        y -= 16;
      }
    }

    return pdf.save();
  }

  private drawSectionTitle(
    page: ReturnType<PDFDocument['addPage']>,
    font: Awaited<ReturnType<PDFDocument['embedFont']>>,
    title: string,
    y: number,
  ) {
    page.drawRectangle({
      x: MARGIN,
      y: y - 4,
      width: PAGE_W - MARGIN * 2,
      height: 18,
      color: PRIMARY,
    });
    page.drawText(title.toUpperCase(), {
      x: MARGIN + 6,
      y: y + 2,
      size: 9,
      font,
      color: DARK,
    });
  }

  private drawKV(
    page: ReturnType<PDFDocument['addPage']>,
    bodyFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
    boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
    key: string,
    value: string,
    y: number,
  ) {
    page.drawText(`${key}:`, {
      x: MARGIN,
      y,
      size: 9,
      font: boldFont,
      color: MUTED,
    });
    page.drawText(value, {
      x: MARGIN + 120,
      y,
      size: 9,
      font: bodyFont,
      color: DARK,
    });
  }

  private drawTableHeader(
    page: ReturnType<PDFDocument['addPage']>,
    boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
    headers: string[],
    widths: number[],
    y: number,
  ) {
    let x = MARGIN;
    for (let i = 0; i < headers.length; i++) {
      page.drawRectangle({
        x,
        y: y - 4,
        width: widths[i],
        height: 16,
        color: DARK,
      });
      page.drawText(headers[i], {
        x: x + 4,
        y: y + 1,
        size: 8,
        font: boldFont,
        color: WHITE,
      });
      x += widths[i];
    }
  }

  private drawTableRow(
    page: ReturnType<PDFDocument['addPage']>,
    bodyFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
    cells: string[],
    widths: number[],
    y: number,
  ) {
    let x = MARGIN;
    for (let i = 0; i < cells.length; i++) {
      page.drawText(this.truncate(cells[i], Math.floor(widths[i] / 5.5)), {
        x: x + 4,
        y: y + 1,
        size: 8,
        font: bodyFont,
        color: DARK,
      });
      x += widths[i];
    }
  }

  private truncate(text: string, maxLen: number): string {
    if (!text) return '';
    return text.length > maxLen ? `${text.slice(0, maxLen - 1)}...` : text;
  }

  private filterAttendanceByDate(
    items: AttendanceEntity[],
    from?: string,
    to?: string,
  ): AttendanceEntity[] {
    if (!from && !to) return items;

    return items.filter((item) => {
      const value = item.recordedAt
        ? item.recordedAt.toISOString().slice(0, 10)
        : '';
      if (from && value < from) return false;
      if (to && value > to) return false;
      return true;
    });
  }

  private filterEvaluationsByDate(
    items: EvaluationEntity[],
    from?: string,
    to?: string,
  ): EvaluationEntity[] {
    if (!from && !to) return items;

    return items.filter((item) => {
      const value = item.evaluationDate;
      if (from && value < from) return false;
      if (to && value > to) return false;
      return true;
    });
  }

  private filterSessionsByDate(
    items: TrainingSessionEntity[],
    from?: string,
    to?: string,
  ): TrainingSessionEntity[] {
    if (!from && !to) return items;

    return items.filter((item) => {
      const value = item.date;
      if (from && value < from) return false;
      if (to && value > to) return false;
      return true;
    });
  }

  private assertTenantAccess(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) return;
    if (tenantId !== actor.tenantId)
      throw new ForbiddenException('Access denied');
  }
}
