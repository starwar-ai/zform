import { Router, Request, Response } from 'express';
import { codeGeneratorApi, CodePrefix, CodeType } from '../services/code-generator.service';
import { serialNumberService } from '../services/serial-number.service';

const router = Router();

/**
 * @swagger
 * /code-generator/generate:
 *   post:
 *     summary: 生成业务编码
 *     tags: [CodeGenerator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - codePrefix
 *             properties:
 *               type:
 *                 type: string
 *                 description: 编码类型
 *                 example: SN_PURCHASEPLAN
 *               codePrefix:
 *                 type: string
 *                 description: 编码前缀
 *                 example: SG
 *               includeTime:
 *                 type: boolean
 *                 description: 是否包含日期
 *                 default: true
 *               length:
 *                 type: integer
 *                 description: 序列号长度
 *                 default: 4
 *     responses:
 *       200:
 *         description: 生成的编码
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: SG25010001
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { type, codePrefix, includeTime, length } = req.body;

    if (!type || !codePrefix) {
      return res.status(400).json({
        error: 'type and codePrefix are required',
      });
    }

    const code = await codeGeneratorApi.generateCodeCustom(
      type,
      codePrefix,
      includeTime ?? true,
      length ?? 4
    );

    res.json({ code });
  } catch (error) {
    console.error('Generate code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/sales-contract:
 *   post:
 *     summary: 生成销售合同编码
 *     tags: [CodeGenerator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isExport
 *               - year
 *             properties:
 *               isExport:
 *                 type: boolean
 *                 description: 是否外销
 *               year:
 *                 type: integer
 *                 description: 年份
 *               isInternal:
 *                 type: boolean
 *                 description: 是否内部合同
 *               companyShortName:
 *                 type: string
 *                 description: 公司简称（内部合同时使用）
 *     responses:
 *       200:
 *         description: 生成的销售合同编码
 */
router.post('/sales-contract', async (req: Request, res: Response) => {
  try {
    const { isExport, year, isInternal, companyShortName } = req.body;

    if (typeof isExport === 'undefined' || !year) {
      return res.status(400).json({
        error: 'isExport and year are required',
      });
    }

    const code = await codeGeneratorApi.generateSalesContractCode({
      isExport,
      year,
      isInternal,
      companyShortName,
    });

    res.json({ code });
  } catch (error) {
    console.error('Generate sales contract code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/purchase-plan:
 *   post:
 *     summary: 生成采购计划编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的采购计划编码
 */
router.post('/purchase-plan', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generatePurchasePlanCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate purchase plan code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/receipt:
 *   post:
 *     summary: 生成收款单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的收款单编码
 */
router.post('/receipt', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateReceiptCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate receipt code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/payment:
 *   post:
 *     summary: 生成付款单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的付款单编码
 */
router.post('/payment', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generatePaymentCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate payment code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/inbound-notice:
 *   post:
 *     summary: 生成入库通知编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的入库通知编码
 */
router.post('/inbound-notice', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateInboundNoticeCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate inbound notice code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/outbound-notice:
 *   post:
 *     summary: 生成出库通知编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的出库通知编码
 */
router.post('/outbound-notice', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateOutboundNoticeCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate outbound notice code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/inbound:
 *   post:
 *     summary: 生成入库单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的入库单编码
 */
router.post('/inbound', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateInboundCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate inbound code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/outbound:
 *   post:
 *     summary: 生成出库单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的出库单编码
 */
router.post('/outbound', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateOutboundCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate outbound code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/shipping-plan:
 *   post:
 *     summary: 生成出运计划编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的出运计划编码
 */
router.post('/shipping-plan', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateShippingPlanCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate shipping plan code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/shipping:
 *   post:
 *     summary: 生成出运单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的出运单编码
 */
router.post('/shipping', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateShippingCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate shipping code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/customs:
 *   post:
 *     summary: 生成报关单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的报关单编码
 */
router.post('/customs', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateCustomsCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate customs code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/inspection:
 *   post:
 *     summary: 生成商检单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的商检单编码
 */
router.post('/inspection', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateInspectionCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate inspection code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/settlement:
 *   post:
 *     summary: 生成结汇单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的结汇单编码
 */
router.post('/settlement', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateSettlementCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate settlement code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/manufacture:
 *   post:
 *     summary: 生成制造单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的制造单编码
 */
router.post('/manufacture', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateManufactureCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate manufacture code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/stocktaking:
 *   post:
 *     summary: 生成盘点单编码
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 生成的盘点单编码
 */
router.post('/stocktaking', async (req: Request, res: Response) => {
  try {
    const code = await codeGeneratorApi.generateStocktakingCode();
    res.json({ code });
  } catch (error) {
    console.error('Generate stocktaking code error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/prefixes:
 *   get:
 *     summary: 获取所有编码前缀
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 编码前缀列表
 */
router.get('/prefixes', (req: Request, res: Response) => {
  res.json({
    prefixes: Object.entries(CodePrefix).map(([key, value]) => ({
      key,
      value,
      description: getPrefixDescription(value),
    })),
  });
});

/**
 * @swagger
 * /code-generator/types:
 *   get:
 *     summary: 获取所有编码类型
 *     tags: [CodeGenerator]
 *     responses:
 *       200:
 *         description: 编码类型列表
 */
router.get('/types', (req: Request, res: Response) => {
  res.json({
    types: Object.entries(CodeType).map(([key, value]) => ({
      key,
      value,
    })),
  });
});

/**
 * @swagger
 * /code-generator/serial-numbers:
 *   get:
 *     summary: 分页查询序列号配置
 *     tags: [CodeGenerator]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: codePrefix
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 序列号配置列表
 */
router.get('/serial-numbers', async (req: Request, res: Response) => {
  try {
    const { page, pageSize, type, codePrefix } = req.query;
    const result = await serialNumberService.findMany({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      type: type as string,
      codePrefix: codePrefix as string,
    });
    res.json(result);
  } catch (error) {
    console.error('Get serial numbers error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/serial-numbers:
 *   post:
 *     summary: 创建序列号配置
 *     tags: [CodeGenerator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - codePrefix
 *             properties:
 *               type:
 *                 type: string
 *               codePrefix:
 *                 type: string
 *               sn:
 *                 type: integer
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: 创建的序列号配置
 */
router.post('/serial-numbers', async (req: Request, res: Response) => {
  try {
    const { type, codePrefix, sn, remark } = req.body;
    const userId = (req as any).user?.id;

    const result = await serialNumberService.createSerialNumber({
      type,
      codePrefix,
      sn,
      remark,
      createdBy: userId,
    });
    res.json(result);
  } catch (error) {
    console.error('Create serial number error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @swagger
 * /code-generator/serial-numbers/{type}/{codePrefix}:
 *   put:
 *     summary: 更新序列号配置
 *     tags: [CodeGenerator]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: codePrefix
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
 *               sn:
 *                 type: integer
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新后的序列号配置
 */
router.put(
  '/serial-numbers/:type/:codePrefix',
  async (req: Request, res: Response) => {
    try {
      const { type, codePrefix } = req.params as { type: string; codePrefix: string };
      const { sn, remark } = req.body;
      const userId = (req as any).user?.id;

      const result = await serialNumberService.updateSerialNumber(
        type,
        codePrefix,
        {
          sn,
          remark,
          updatedBy: userId,
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Update serial number error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * @swagger
 * /code-generator/serial-numbers/{type}/{codePrefix}:
 *   delete:
 *     summary: 删除序列号配置
 *     tags: [CodeGenerator]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: codePrefix
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete(
  '/serial-numbers/:type/:codePrefix',
  async (req: Request, res: Response) => {
    try {
      const { type, codePrefix } = req.params as { type: string; codePrefix: string };
      await serialNumberService.deleteSerialNumber(type, codePrefix);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete serial number error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * 获取编码前缀描述
 */
function getPrefixDescription(prefix: string): string {
  const descriptions: Record<string, string> = {
    VK: '外销合同',
    DT: '内销合同',
    SG: '采购计划',
    SK: '收款单',
    FK: '付款单',
    RE: '入库通知',
    TT: '出库通知',
    YS: '入库单',
    CK: '出库单',
    SP: '出运计划',
    CY: '出运单',
    BG: '报关单',
    SJ: '商检单',
    JH: '结汇单',
    MF: '制造单',
    ST: '盘点单',
  };
  return descriptions[prefix] || '';
}

export default router;
