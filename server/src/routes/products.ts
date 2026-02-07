import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Products
 *     description: Product management
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         status:
 *           type: string
 *       required:
 *         - id
 *         - code
 *         - name
 *     ProductCreateInput:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         status:
 *           type: string
 *       required:
 *         - code
 *         - name
 */

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateInput'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.post('/', productController.create);
router.get('/', productController.list);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   put:
 *     tags: [Products]
 *     summary: Update product by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateInput'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *   delete:
 *     tags: [Products]
 *     summary: Delete product by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No Content
 */
router.get('/:id', productController.getById);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

/**
 * @openapi
 * /products/{id}/bom:
 *   post:
 *     tags: [Products]
 *     summary: Add BOM item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/:id/bom', productController.addBom);

/**
 * @openapi
 * /products/{id}/accessories:
 *   post:
 *     tags: [Products]
 *     summary: Add accessory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/:id/accessories', productController.addAccessory);

/**
 * @openapi
 * /products/{id}/change-logs:
 *   get:
 *     tags: [Products]
 *     summary: Get product change logs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:id/change-logs', productController.getChangeLogs);

export default router;
