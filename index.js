const hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const mongoose = require('mongoose');
const config = require('config');
const { graphqlHapi, graphiqlHapi } = require('apollo-server-hapi');

const package = require('./package');
const Painting = require('./models/Painting');
const schema = require('./graphql/schema');

const dbConfig = config.get('db');
const {
  username: dbUsername,
  password: dbPassword,
  host: dbHost,
  port: dbPort,
  name: dbName,
} = dbConfig;

mongoose.connect(`mongodb://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`, { useNewUrlParser: true });
mongoose.connection.once('open', () => {
  console.log('Connected to database');
});

const port = 5000;
const host = 'localhost';

const server = hapi.server({ port, host });

const init = async () => {
  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: 'Paiting API Documentation',
          version: package.version,
        },
      },
    }, {
      plugin: graphiqlHapi,
      options: {
        path: '/graphiql',
        graphiqlOptions: {
          endpointURL: '/graphql',
        },
        route: {
          cors: true
        },
      },
    }, {
      plugin: graphqlHapi,
      options: {
        path: '/graphql',
        graphqlOptions: {
          schema,
        },
        route: {
          cors: true,
        },
      },
    }
  ]);

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: () => {
        return('<h1>Modern API</h1>');
      },
    }, {
      method: 'GET',
      path: '/api/v1/painting',
      config: {
        description: 'Get all the paintings',
        tags: ['api', 'v1', 'paintings'],
      },
      handler: () => {
        return Painting.find();
      }
    }, {
      method: 'POST',
      path: '/api/v1/painting',
      config: {
        description: 'Post a  paintings',
        tags: ['api', 'v1', 'paintings'],
      },
      handler: (req, reply) => {
        const { name, url, techniques } = req.payload;
        const painting = new Painting({
          name,
          url,
          techniques,
        });

        return painting.save();
      }
    }
  ]);

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

init();
