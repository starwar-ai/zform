import { Router, Request, Response } from 'express';
import { exchangeRateService } from '../services/exchange-rate.service';
import { rateApi } from '../services/rate-api.service';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

/**
 * @swagger
 * /rates:
 *   get:
 *     summary: 获取汇率列表
 *     tags: [Exchange Rates]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: rateDate
 *         schema:
 *           type: string
 *         description: 日期 (YYYY-MM-DD)
 *       - in: query
 *         name: currencyName
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 汇率列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, pageSize, rateDate, currencyName, startDate, endDate } = req.query;
    const result = await exchangeRateService.findMany({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      rateDate: rateDate as string,
      currencyName: currencyName as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(result);
  } catch (error) {
    console.error('Get rates error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/today:
 *   get:
 *     summary: 获取今日汇率Map
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: 今日汇率Map
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rates:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const rateMap = await rateApi.getDailyRateMap();
    
    // 转换为普通对象
    const rates: Record<string, number> = {};
    rateMap.forEach((value, key) => {
      rates[key] = value.toNumber();
    });

    res.json({
      date: new Date().toISOString().split('T')[0],
      rates,
    });
  } catch (error) {
    console.error('Get today rates error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/date/{date}:
 *   get:
 *     summary: 获取指定日期的汇率
 *     tags: [Exchange Rates]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         description: 日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 指定日期的汇率
 */
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params as { date: string };
    const rates = await rateApi.getRatesByDate(date);
    
    res.json({
      date,
      rates,
    });
  } catch (error) {
    console.error('Get rates by date error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/map/{date}:
 *   get:
 *     summary: 获取指定日期的汇率Map
 *     tags: [Exchange Rates]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         description: 日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 汇率Map
 */
router.get('/map/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params as { date: string };
    const rateMap = await exchangeRateService.getDailyRateMapByDate(date);
    
    // 转换为普通对象
    const rates: Record<string, number> = {};
    rateMap.forEach((value, key) => {
      rates[key] = value.toNumber();
    });

    res.json({
      date,
      rates,
    });
  } catch (error) {
    console.error('Get rate map error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/currencies:
 *   get:
 *     summary: 获取所有可用币种
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: 币种列表
 */
router.get('/currencies', async (req: Request, res: Response) => {
  try {
    const currencies = await rateApi.getAllCurrenciesByDate();
    res.json({
      currencies: Array.from(currencies),
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/convert:
 *   post:
 *     summary: 货币转换
 *     tags: [Exchange Rates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - fromCurrency
 *             properties:
 *               amount:
 *                 type: number
 *               fromCurrency:
 *                 type: string
 *               toCurrency:
 *                 type: string
 *                 default: CNY
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: 转换后的金额
 */
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { amount, fromCurrency, toCurrency = 'CNY', date } = req.body;

    if (!amount || !fromCurrency) {
      return res.status(400).json({
        error: 'amount and fromCurrency are required',
      });
    }

    const convertedAmount = await rateApi.convertCurrency(
      amount,
      fromCurrency,
      toCurrency,
      date ? new Date(date) : undefined
    );

    res.json({
      originalAmount: amount,
      fromCurrency,
      toCurrency,
      convertedAmount: convertedAmount.toNumber(),
      rate: (await rateApi.getRateByCurrencyName(fromCurrency))?.toNumber(),
    });
  } catch (error) {
    console.error('Convert currency error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/convert-batch:
 *   post:
 *     summary: 批量转换为人民币
 *     tags: [Exchange Rates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amounts
 *             properties:
 *               amounts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: 转换后的总金额（人民币）
 */
router.post('/convert-batch', async (req: Request, res: Response) => {
  try {
    const { amounts, date } = req.body;

    if (!amounts || !Array.isArray(amounts)) {
      return res.status(400).json({
        error: 'amounts array is required',
      });
    }

    const totalCNY = await rateApi.getAmountsInCNY(
      amounts,
      date ? new Date(date) : undefined
    );

    res.json({
      totalInCNY: totalCNY.toNumber(),
      items: amounts,
    });
  } catch (error) {
    console.error('Batch convert error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates:
 *   post:
 *     summary: 创建汇率记录
 *     tags: [Exchange Rates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rateDate
 *               - currencyName
 *               - rate
 *             properties:
 *               rateDate:
 *                 type: string
 *               currencyName:
 *                 type: string
 *               rate:
 *                 type: number
 *               midRate:
 *                 type: number
 *               source:
 *                 type: integer
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: 创建的汇率记录
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { rateDate, currencyName, rate, midRate, source, remark } = req.body;
    const userId = (req as any).user?.id;

    if (!rateDate || !currencyName || rate === undefined) {
      return res.status(400).json({
        error: 'rateDate, currencyName and rate are required',
      });
    }

    const result = await exchangeRateService.createRate({
      rateDate,
      currencyName,
      rate: new Decimal(rate),
      midRate: midRate ? new Decimal(midRate) : null,
      source,
      remark,
      createdBy: userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Create rate error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/batch:
 *   post:
 *     summary: 批量创建汇率记录
 *     tags: [Exchange Rates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - rates
 *             properties:
 *               date:
 *                 type: string
 *               rates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     currencyName:
 *                       type: string
 *                     rate:
 *                       type: number
 *                     midRate:
 *                       type: number
 *     responses:
 *       200:
 *         description: 创建的记录数
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { date, rates } = req.body;
    const userId = (req as any).user?.id;

    if (!date || !rates || !Array.isArray(rates)) {
      return res.status(400).json({
        error: 'date and rates array are required',
      });
    }

    const ratesInput = rates.map(r => ({
      rateDate: date,
      currencyName: r.currencyName,
      rate: new Decimal(r.rate),
      midRate: r.midRate ? new Decimal(r.midRate) : null,
      source: r.source ?? 0,
      createdBy: userId,
    }));

    const count = await exchangeRateService.batchCreateRates(ratesInput, date);

    res.json({
      success: true,
      createdCount: count,
      message: `Created ${count} rate records`,
    });
  } catch (error) {
    console.error('Batch create rates error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/fetch:
 *   post:
 *     summary: 从外部API获取并保存今日汇率
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: 获取结果
 */
router.post('/fetch', async (req: Request, res: Response) => {
  try {
    const results = await exchangeRateService.fetchAndSaveDailyRates();
    
    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      results: results.map(r => ({
        currency: r.currency,
        rate: r.rate?.toNumber() || null,
      })),
    });
  } catch (error) {
    console.error('Fetch rates error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/{rateDate}/{currencyName}:
 *   put:
 *     summary: 更新汇率记录
 *     tags: [Exchange Rates]
 *     parameters:
 *       - in: path
 *         name: rateDate
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: currencyName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rate:
 *                 type: number
 *               midRate:
 *                 type: number
 *               source:
 *                 type: integer
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新后的汇率记录
 */
router.put('/:rateDate/:currencyName', async (req: Request, res: Response) => {
  try {
    const { rateDate, currencyName } = req.params as { rateDate: string; currencyName: string };
    const { rate, midRate, source, remark } = req.body;
    const userId = (req as any).user?.id;

    const result = await exchangeRateService.updateRate(rateDate, currencyName, {
      rate: rate !== undefined ? new Decimal(rate) : undefined,
      midRate: midRate !== undefined ? new Decimal(midRate) : undefined,
      source,
      remark,
      updatedBy: userId,
    });

    res.json(result);
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/{rateDate}/{currencyName}:
 *   delete:
 *     summary: 删除汇率记录
 *     tags: [Exchange Rates]
 *     parameters:
 *       - in: path
 *         name: rateDate
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: currencyName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:rateDate/:currencyName', async (req: Request, res: Response) => {
  try {
    const { rateDate, currencyName } = req.params as { rateDate: string; currencyName: string };
    await exchangeRateService.deleteRate(rateDate, currencyName);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete rate error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /rates/cache/clear:
 *   post:
 *     summary: 清除汇率缓存
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: 缓存已清除
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    exchangeRateService.clearCache();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
