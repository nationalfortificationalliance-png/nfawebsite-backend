import type { Schema, Struct } from '@strapi/strapi';

export interface AboutTimelineItem extends Struct.ComponentSchema {
  collectionName: 'components_about_timeline_items';
  info: {
    description: "A year/event entry in the About page's Two Decades of Progress timeline";
    displayName: 'Timeline Item';
  };
  attributes: {
    event: Schema.Attribute.Text & Schema.Attribute.Required;
    year: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

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

export interface SharedMemberOrganization extends Struct.ComponentSchema {
  collectionName: 'components_shared_member_organizations';
  info: {
    description: "A single named company/organization participating within a sector partner (e.g. a Flour Miller under the 'Flour Millers' sector)";
    displayName: 'Member Organization';
  };
  attributes: {
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 150;
      }>;
    website_url: Schema.Attribute.String;
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
      'about.timeline-item': AboutTimelineItem;
      'shared.bullet-point': SharedBulletPoint;
      'shared.member-organization': SharedMemberOrganization;
      'shared.seo': SharedSeo;
    }
  }
}
