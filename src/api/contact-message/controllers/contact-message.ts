// @ts-nocheck
import { factories } from '@strapi/strapi';

// Attachment rules for the public contact form: the client validates too,
// but this is the enforcement point since the endpoint is unauthenticated.
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3;

export default factories.createCoreController('api::contact-message.contact-message', ({ strapi }) => ({
    async create(ctx) {
        let files = [];

        if (ctx.is('multipart')) {
            const uploaded = ctx.request.files?.['files.attachments'];
            files = uploaded ? (Array.isArray(uploaded) ? uploaded : [uploaded]) : [];

            if (files.length > MAX_FILES) {
                return ctx.badRequest(`A maximum of ${MAX_FILES} attachments is allowed`);
            }
            for (const file of files) {
                const name = file.originalFilename || file.name || '';
                const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
                const mime = file.mimetype || file.type || '';
                if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mime)) {
                    return ctx.badRequest('Only PDF, DOC, and DOCX attachments are allowed');
                }
                if (file.size > MAX_FILE_SIZE) {
                    return ctx.badRequest('Each attachment must be 5MB or smaller');
                }
            }

            // The core controller expects body.data as an object, but
            // multipart form fields arrive as strings
            if (typeof ctx.request.body?.data === 'string') {
                try {
                    ctx.request.body.data = JSON.parse(ctx.request.body.data);
                } catch {
                    return ctx.badRequest('Invalid "data" payload');
                }
            }
        }

        const response = await super.create(ctx);

        // The core content API does not handle files, so attach them to the
        // created entry through the upload service (no public upload route)
        if (files.length > 0 && response?.data?.id) {
            await strapi.plugin('upload').service('upload').upload({
                data: {
                    ref: 'api::contact-message.contact-message',
                    refId: response.data.id,
                    field: 'attachments',
                },
                files,
            });
        }

        return response;
    },
}));
