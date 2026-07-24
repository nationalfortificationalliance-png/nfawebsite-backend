import type { Schema, Struct } from '@strapi/strapi';

export interface SharedBulletPoint extends Struct.ComponentSchema {
  collectionName: 'components_shared_bullet_points';
  info: {
    description: 'A single itemized contribution/responsibility line';
    displayName: 'Bullet Point';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.bullet-point': SharedBulletPoint;
      'shared.seo': SharedSeo;
    }
  }
}
