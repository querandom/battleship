import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import config from './config';
import logger from './lib/logger';
import createApolloServer from './graphql/create-apollo-server';

const devEnvironment = config.env.match(/development|test/);
const app = express();

app.use(morgan('tiny'));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('/graphql', (req, res, next) => {
  // console.log(req.headers);
  next();
});
createApolloServer({ app, playground: devEnvironment });

if (devEnvironment) {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const webpackConfig = require('../../webpack.config.babel.js').default;


  const compiler = webpack(webpackConfig);
  const middleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: {
      noInfo: true,
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false,
    }
  });

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    reload: true
  }));

  app.use(express.static(config.paths.public));

  app.get('/*', (req, res) => {
    res.set('content-type', 'text/html');

    try {
      res.write(middleware.fileSystem.readFileSync(`${config.paths.dist}/index.html`));
    } catch (err) {
      logger.error(err)
    }

    res.end()
  })
} else {
  app.use(express.static(`${config.paths.dist}`));

  app.get('/*', (req, res) => {
    res.sendFile(`${config.paths.dist}/index.html`);
  });
}

export default app