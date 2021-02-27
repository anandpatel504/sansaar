const Joi = require('@hapi/joi');
const User = require('../models/user');
const Pathways = require('../models/pathway');

module.exports = [
  {
    method: 'GET',
    path: '/pathways/{pathwayId}/mentorship/users/{userId}/mentees',
    options: {
      description: 'Get the mentees for a given user under the specified pathway.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
        scope: ['team', 'facha', 'dumbeldore', 'trainingAndPlacement'],
      },
      validate: {
        params: Joi.object({
          userId: User.field('id'),
          pathwayId: Pathways.field('id'),
        }),
      },
      handler: async (request) => {
        const {
          displayService,
          mentorshipService,
          userService,
          pathwayService,
        } = request.services();

        const { pathwayId, userId } = request.params;
        await pathwayService.findById(pathwayId);
        await userService.findById(userId);

        const mentees = await mentorshipService.getMentees(pathwayId, userId);
        return { mentees: await displayService.userProfile(mentees) };
      },
    },
  },
  {
    method: 'POST',
    path: '/pathways/{pathwayId}/mentorship/users/{userId}/mentees',
    options: {
      description: 'Add mentees to a user under a specified pathway.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
        scope: ['team', 'facha', 'dumbeldore', 'trainingAndPlacement'],
      },
      validate: {
        params: Joi.object({
          userId: User.field('id'),
          pathwayId: Pathways.field('id'),
        }),
        payload: Joi.object({
          menteeIds: Joi.array().items(User.field('id')),
        }),
      },
      handler: async (request, h) => {
        const {
          displayService,
          mentorshipService,
          userService,
          pathwayService,
        } = request.services();

        const { pathwayId, userId } = request.params;
        const { menteeIds } = request.payload;
        await pathwayService.findById(pathwayId);
        await userService.findById(userId);

        const addAndFetchMentees = async (txn) => {
          await mentorshipService.addMentees(pathwayId, userId, menteeIds, txn);
          return mentorshipService.getMentees(pathwayId, userId, txn);
        };

        const mentees = await h.context.transaction(addAndFetchMentees);

        return { mentees: await displayService.userProfile(mentees) };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/pathways/{pathwayId}/mentorship/users/{userId}/mentees',
    options: {
      description: 'Delete mentees of a user under the specified pathway.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
        scope: ['team', 'facha', 'dumbeldore', 'trainingAndPlacement'],
      },
      validate: {
        params: Joi.object({
          userId: User.field('id'),
          pathwayId: Pathways.field('id'),
        }),
        payload: Joi.object({
          menteeIds: Joi.array().items(User.field('id')),
        }),
      },
      handler: async (request, h) => {
        const {
          displayService,
          mentorshipService,
          userService,
          pathwayService,
        } = request.services();

        const { pathwayId, userId } = request.params;
        const { menteeIds } = request.payload;
        await pathwayService.findById(pathwayId);
        await userService.findById(userId);

        const deleteAndFetchMentees = async (txn) => {
          await mentorshipService.deleteMentees(pathwayId, userId, menteeIds, txn);
          return mentorshipService.getMentees(pathwayId, userId, txn);
        };

        const mentees = await h.context.transaction(deleteAndFetchMentees);

        return { mentees: await displayService.userProfile(mentees) };
      },
    },
  },
  {
    method: 'GET',
    path: '/pathways/{pathwayId}/mentorship/tree',
    options: {
      description: 'Get the complete mentorship tree of a pathway by pathway id.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
        scope: ['team', 'facha', 'dumbeldore', 'trainingAndPlacement'],
      },
      validate: {
        params: Joi.object({
          pathwayId: Pathways.field('id'),
        }),
      },
      handler: async (request) => {
        const { mentorshipService, pathwayService } = request.services();

        const { pathwayId } = request.params;
        await pathwayService.findById(pathwayId);
        const tree = await mentorshipService.getMentorTree(pathwayId);
        return { tree };
      },
    },
  },
];
