import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  // Using Railway volume at /app/public/uploads for file storage
  // Uploads will persist across deployments
});

export default config;
