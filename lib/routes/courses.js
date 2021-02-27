const Joi = require('@hapi/joi');
const Courses = require('../models/courses');

module.exports = [
  {
    method: 'GET',
    path: '/courses',
    options: {
      description: 'Get all courses. Also gives enrolled courses if user is authenticated.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
        mode: 'optional',
      },
      handler: async (request) => {
        const { coursesService, displayService } = request.services();
        const courses = await coursesService.getAllCourses();
        if (request.auth.isAuthenticated) {
          const authUser = request.auth.credentials;
          return displayService.allCoursesWithEnrolled(courses, authUser);
        }
        return courses;
      },
    },
  },
  {
    method: 'GET',
    path: '/courses/recommended',
    options: {
      description: 'Get 3 randomly recommended courses.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
      },
      handler: async (request) => {
        const { coursesService } = request.services();
        const courses = await coursesService.getRecommendedCourses();
        return courses;
      },
    },
  },
  {
    method: 'GET',
    path: '/courses/{courseId}/exercises',
    options: {
      description: 'Get exercises of a course by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          courseId: Courses.field('id'),
        }),
      },
      handler: async (request) => {
        const { displayService } = request.services();
        const { courseId } = request.params;
        const course = await displayService.getCourseExercises(courseId);

        return { course };
      },
    },
  },
  {
    method: 'POST',
    path: '/courses/{courseId}/enroll',
    options: {
      description: 'Enroll in the course by id.',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
      },
      validate: {
        params: Joi.object({
          courseId: Courses.field('id'),
        }),
      },
      handler: async (request, h) => {
        const { coursesService } = request.services();
        const authUser = request.auth.credentials;
        const { courseId } = request.params;
        const courseEnroll = async (txn) => {
          return coursesService.enrollInCourse(courseId, authUser, txn);
        };
        const enrollInCourse = await h.context.transaction(courseEnroll);
        return {
          enrollInCourse,
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/courses/name',
    options: {
      description:
        'Get course by name for identifying whether course exist or not while running courseSeeder script',
      tags: ['api'],
      validate: {
        query: Joi.object({
          name: Courses.field('name'),
        }),
      },
      handler: async (request) => {
        const { coursesService } = request.services();
        const course = await coursesService.findByCourseName(request.query.name);
        return { course };
      },
    },
  },
];
