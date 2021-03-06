const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const Pathways = require('../models/pathway');
const ProgressParameters = require('../models/progressParameter');
const ProgressQuestions = require('../models/progressParameter');
const { getRouteScope } = require('./helpers');

module.exports = [
  {
    method: 'GET',
    path: '/pathways/{pathwayId}/trackingForm',
    options: {
      description: 'Tracking form associated with the pathway.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
        scope: getRouteScope('team'),
      },
      validate: {
        params: Joi.object({
          pathwayId: Pathways.field('id'),
        }),
      },
      handler: async (request) => {
        const { progressTrackingService, pathwayService, displayService } = request.services();

        const { pathwayId } = request.params;
        const [errWhileFetching, pathway] = await pathwayService.findById(pathwayId);
        if (errWhileFetching) {
          return errWhileFetching;
        }
        if (!pathway.tracking_enabled) {
          throw Boom.badRequest('Given pathway does not have tracking enabled.');
        }
        const [err, form] = await progressTrackingService.getTrackingForm(pathwayId);
        if (err) {
          return err;
        }
        return { form: await displayService.pathwayTrackingForm(form) };
      },
    },
  },
  {
    method: 'PUT',
    path: '/pathways/{pathwayId}/trackingForm',
    options: {
      description:
        'Edit the parameters and questions in the tracking form associated with the pathway.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
        scope: getRouteScope('team'),
      },
      validate: {
        params: Joi.object({
          pathwayId: Pathways.field('id'),
        }),
        payload: Joi.object({
          paramIds: Joi.array().items(ProgressParameters.field('id')),
          questionIds: Joi.array().items(ProgressQuestions.field('id')),
        }),
      },
      handler: async (request, h) => {
        const { progressTrackingService, pathwayService, displayService } = request.services();

        const { pathwayId } = request.params;
        const { paramIds, questionIds } = request.payload;

        const [errWhileFetching, pathway] = await pathwayService.findById(pathwayId);
        if (errWhileFetching) {
          return errWhileFetching;
        }
        if (!pathway.tracking_enabled) {
          throw Boom.badRequest('Given pathway does not have tracking enabled.');
        }

        const updateAndFetch = async (txn) => {
          // eslint-disable-next-line
          const [err, trackingForm] = await progressTrackingService.updateTrackingForm(
            pathwayId,
            questionIds,
            paramIds,
            txn
          );
          if (err) {
            return [err, null];
          }
          const trackingFormGraph = await progressTrackingService.getTrackingForm(pathwayId, txn);
          return [null, trackingFormGraph];
        };
        const [err, form] = await h.context.transaction(updateAndFetch);
        if (err) {
          return err;
        }
        return { form: await displayService.pathwayTrackingForm(form) };
      },
    },
  },
];
