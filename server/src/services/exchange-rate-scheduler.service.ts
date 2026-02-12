import * as schedule from 'node-schedule';
import { exchangeRateService } from './exchange-rate.service';
import prisma from '../config/database';

/**
 * 汇率调度器配置接口
 */
interface SchedulerConfig {
  fetchCount: number;
  fetchTimes: string[];
}

/**
 * 调度器状态接口
 */
interface SchedulerStatus {
  running: boolean;
  jobs: Array<{
    name: string;
    nextInvocation: Date | null;
  }>;
  lastRunTime: Date | null;
  lastRunStatus: 'success' | 'error' | null;
  lastRunMessage: string | null;
}

/**
 * 汇率定时抓取调度器服务
 * 从 other_config/config_parameters 表读取配置，定时调用汇率抓取
 */
export class ExchangeRateSchedulerService {
  private jobs: Map<string, schedule.Job> = new Map();
  private lastRunTime: Date | null = null;
  private lastRunStatus: 'success' | 'error' | null = null;
  private lastRunMessage: string | null = null;

  /**
   * 从数据库加载配置
   */
  private async loadConfig(): Promise<SchedulerConfig> {
    // 查找汇率抓取配置
    const config = await prisma.otherConfig.findUnique({
      where: { id: 'other-config-rate-scheduler' },
      include: { parameters: true },
    });

    if (!config || !config.parameters) {
      console.log('[RateScheduler] No config found, using defaults');
      return {
        fetchCount: 3,
        fetchTimes: ['08:00', '12:00', '18:00'],
      };
    }

    // 解析参数
    let fetchCount = 3;
    let fetchTimes: string[] = ['08:00', '12:00', '18:00'];

    for (const param of config.parameters) {
      if (param.name === '每日抓取次数' && param.value) {
        fetchCount = parseInt(param.value, 10);
      }
      if (param.name === '抓取时间列表' && param.value) {
        try {
          const parsed = JSON.parse(param.value);
          if (Array.isArray(parsed)) {
            fetchTimes = parsed;
          }
        } catch {
          console.error('[RateScheduler] Failed to parse fetch times');
        }
      }
    }

    return { fetchCount, fetchTimes };
  }

  /**
   * 解析时间字符串为 cron 表达式
   * @param timeStr 时间字符串，格式 "HH:mm" (e.g., "08:00", "18:30")
   * @returns cron 表达式 (e.g., "0 8 * * *")
   */
  private timeToCron(timeStr: string): string {
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    
    return `${minute} ${hour} * * *`;
  }

  /**
   * 验证时间格式
   */
  private isValidTimeFormat(timeStr: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(timeStr);
  }

  /**
   * 停止所有定时任务
   */
  private stopAllJobs(): void {
    for (const [name, job] of this.jobs) {
      job.cancel();
      console.log(`[RateScheduler] Cancelled job: ${name}`);
    }
    this.jobs.clear();
  }

  /**
   * 创建单个定时任务
   */
  private createJob(timeStr: string): void {
    if (!this.isValidTimeFormat(timeStr)) {
      console.error(`[RateScheduler] Invalid time format: ${timeStr}`);
      return;
    }

    const cronExpression = this.timeToCron(timeStr);
    const jobName = `rate-fetch-${timeStr.replace(':', '-')}`;

    const job = schedule.scheduleJob(jobName, cronExpression, async () => {
      await this.executeFetch(timeStr);
    });

    if (job) {
      this.jobs.set(jobName, job);
      console.log(`[RateScheduler] Scheduled job: ${jobName} with cron: ${cronExpression}`);
    } else {
      console.error(`[RateScheduler] Failed to schedule job: ${jobName}`);
    }
  }

  /**
   * 执行汇率抓取
   */
  private async executeFetch(timeStr: string): Promise<void> {
    console.log(`[RateScheduler] Executing scheduled fetch at ${timeStr}`);
    this.lastRunTime = new Date();

    try {
      const results = await exchangeRateService.fetchAndSaveDailyRates();
      
      const successCount = results.filter(r => r.rate !== null).length;
      const failCount = results.filter(r => r.rate === null).length;
      
      this.lastRunStatus = 'success';
      this.lastRunMessage = `成功: ${successCount}, 失败: ${failCount}`;
      
      console.log(`[RateScheduler] Fetch completed. ${this.lastRunMessage}`);
    } catch (error) {
      this.lastRunStatus = 'error';
      this.lastRunMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[RateScheduler] Fetch failed:', error);
    }
  }

  /**
   * 手动触发抓取
   */
  async triggerFetch(): Promise<{ success: boolean; message: string; results?: any[] }> {
    console.log('[RateScheduler] Manual fetch triggered');
    
    try {
      const results = await exchangeRateService.fetchAndSaveDailyRates();
      
      const successCount = results.filter(r => r.rate !== null).length;
      const failCount = results.filter(r => r.rate === null).length;
      
      this.lastRunTime = new Date();
      this.lastRunStatus = 'success';
      this.lastRunMessage = `成功: ${successCount}, 失败: ${failCount}`;

      return {
        success: true,
        message: `汇率抓取完成。成功: ${successCount}, 失败: ${failCount}`,
        results,
      };
    } catch (error) {
      this.lastRunTime = new Date();
      this.lastRunStatus = 'error';
      this.lastRunMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: this.lastRunMessage,
      };
    }
  }

  /**
   * 加载配置并启动调度
   */
  async loadConfigAndSchedule(): Promise<void> {
    // 停止现有任务
    this.stopAllJobs();

    // 加载配置
    const config = await this.loadConfig();
    console.log(`[RateScheduler] Loaded config: fetchCount=${config.fetchCount}, fetchTimes=${config.fetchTimes.join(', ')}`);

    // 创建新任务
    for (const timeStr of config.fetchTimes) {
      this.createJob(timeStr);
    }

    console.log(`[RateScheduler] Started ${this.jobs.size} scheduled jobs`);
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    console.log('[RateScheduler] Starting scheduler...');
    await this.loadConfigAndSchedule();
    console.log('[RateScheduler] Scheduler started');
  }

  /**
   * 停止调度器
   */
  async stop(): Promise<void> {
    console.log('[RateScheduler] Stopping scheduler...');
    this.stopAllJobs();
    console.log('[RateScheduler] Scheduler stopped');
  }

  /**
   * 获取调度器状态
   */
  getStatus(): SchedulerStatus {
    const jobs = Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      nextInvocation: job.nextInvocation() as Date | null,
    }));

    return {
      running: this.jobs.size > 0,
      jobs,
      lastRunTime: this.lastRunTime,
      lastRunStatus: this.lastRunStatus,
      lastRunMessage: this.lastRunMessage,
    };
  }
}

// 导出单例实例
export const exchangeRateSchedulerService = new ExchangeRateSchedulerService();
