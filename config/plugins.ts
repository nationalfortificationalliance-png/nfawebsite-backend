import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  // Using Railway volume at /app/public/uploads for file storage
  // Uploads will persist across deployments

  // Internationalization configuration
  i18n: {
    enabled: true,
    config: {
      locales: ['en', 'ha', 'ig', 'yo'], // English, Hausa, Igbo, Yoruba
      defaultLocale: 'en',
    },
  },
});

export default config;
