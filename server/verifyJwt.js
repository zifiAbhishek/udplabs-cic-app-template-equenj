import dotenv from 'dotenv';
import { existsSync } from 'fs'

import JwtVerifier from './jwtVerifier.js';
import config from '../config.js';

export const loadEnv = (options) => {
    if (existsSync('.env.local')) {
        dotenv.config({ path: `.env.local`, ...options });
    }

    dotenv.config(options);
};

loadEnv();

const { auth, server } = config || {};

const {
    AUTH_CLIENT_ID: clientId = auth?.clientId,
    AUTH_DOMAIN: domain = auth?.domain,
    AUTH_ISSUER: ISSUER = auth?.issuer,
    SERVER_AUDIENCE: AUDIENCE = server?.audience || auth?.audience,
} = process.env;

const audience = Array.isArray(AUDIENCE)
    ? AUDIENCE
    : AUDIENCE?.includes(', ')
        ? AUDIENCE?.split(', ')
        : AUDIENCE?.split(',');

const issuer =
    ISSUER || domain.lastIndexOf('/') === domain.length - 1
        ? 'https://' + domain
        : 'https://' + domain + '/';

export const verifyJwt = (options) => {
    if (audience && options?.audience?.includes('not_configured')) {
        delete options.audience;
    }

    options = {
        issuer,
        clientId,
        audience,
        ...options,
    };

    const verifier = new JwtVerifier(options);

    const verifyToken = async (req, res, next) => {
        try {
            if (
                req?.method === 'OPTIONS' &&
                req.get('access-control-request-headers')
            ) {
                console.log('doing OPTIONS');
                const hasAuthInAccessControl = req
                    .get('access-control-request-headers')
                    ?.split(',')
                    ?.map((header) => header?.trim()?.toLowerCase())
                    ?.includes('authorization');

                if (hasAuthInAccessControl) {
                    return next();
                }
            }
            const authHeader = req.get('authorization');
            const match = authHeader?.match(/Bearer (.+)/) || [];

            if (match.length < 1) {
                return res.status(401).send('Unable to parse `Authorization` header');
            }

            const accessToken = match[1];

            req.jwt = await verifier.verifyToken(accessToken, {
                audience: options?.audience,
            });

            next();
        } catch (error) {
            const response = {
                success: false,
                message: error?.message,
            };

            if (error?.message.includes('|')) {
                response.status = error.message.split('|')[0];
                response['errorDetails'] = JSON.parse(error.message.split('|')[1]);
                delete response.message;
            }

            if (error?.details?.includes('|')) {
                response.status = error.details.split('|')[0];
                response['errorDetails'] = error.details.split('|')[1];
            }

            res.status(401).json(response);
        }
    };

    return verifyToken;
};