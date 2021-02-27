const Joi = require('@hapi/joi');

module.exports = [
  {
    method: 'GET',
    path: '/chat/users',
    options: {
      description: 'Get matrix users. Change limit in params to get specified number of users.',
      tags: ['api'],
      validate: {
        query: Joi.object({
          deactivated: Joi.boolean().default(false),
          dir: Joi.string().length(1).default('f'),
          guests: Joi.boolean().default(true),
          limit: Joi.number().default(10),
          order_by: Joi.string().default('id'),
        }),
      },
      handler: async (request) => {
        const { chatService } = request.services();
        return chatService.getAllUsers(request.query);
      },
    },
  },
  {
    method: 'GET',
    path: '/chat/users/{userId}',
    options: {
      description: 'Get matrix user details by user id',
      tags: ['api'],
      validate: {
        params: Joi.object({
          userId: Joi.string().pattern(/^@([a-z0-9])+:(navgurukul.org)$/),
        }),
      },
      handler: async (request) => {
        const { chatService } = request.services();
        return chatService.getUser(request.params.userId);
      },
    },
  },
  {
    method: 'POST',
    path: '/chat/users',
    options: {
      description: 'Create a new user in matrix',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          displayName: Joi.string().min(6),
          id: Joi.string(),
          password: Joi.string().min(8),
          threepids: Joi.array(),
        }),
      },
      handler: async (request) => {
        const { chatService } = request.services();
        return chatService.createChatUser(request.payload);
      },
    },
  },
  {
    method: 'POST',
    path: '/chat/login',
    options: {
      description: 'Login into matrix',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
      },
      handler: async (request) => {
        const { chatService } = request.services();
        return chatService.userChatLogin(request.auth.credentials.id);
      },
    },
  },
];
