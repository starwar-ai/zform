import swaggerJsdoc from 'swagger-jsdoc';

const isProd = process.env.NODE_ENV === 'production';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ZForm API',
      version: '1.0.0',
      description: 'ZForm enterprise document management backend API',
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
  },
  apis: isProd
    ? ['dist/routes/*.js', 'dist/controllers/*.js']
    : ['src/routes/*.ts', 'src/controllers/*.ts'],
});

export default swaggerSpec;
