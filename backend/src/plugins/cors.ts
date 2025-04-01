import cors, { FastifyCorsOptions } from '@fastify/cors'
import { FastifyInstance } from 'fastify'
import fp from "fastify-plugin";

export default fp<FastifyCorsOptions>(async (fastify: FastifyInstance) => {
    await fastify.register(cors, {
        hook: 'preHandler',
        methods: '*'
      })
})