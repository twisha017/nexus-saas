import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`nexus-saas-core running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const handleShutdown = (signal : string) =>{
    logger.warn(`revived ${signal} ... gracefully shutting down..`);
    server.close(()=>{
        logger.info('http server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', ()=> handleShutdown('SIGTERM'));
process.on('SIGINT', ()=> handleShutdown('SIGINT'));
