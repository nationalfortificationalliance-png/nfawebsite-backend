import type { Schema, Struct } from '@strapi/strapi';

export interface AboutChallengeStat extends Struct.ComponentSchema {
  collectionName: 'components_about_challenge_stats';
  info: {
    description: "A stat item in the About page's Hidden Hunger Crisis section";
    displayName: 'Challenge Stat';
  };
  attributes: {
    description: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    source: Schema.Attribute.String;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutKeyStat extends Struct.ComponentSchema {
  collectionName: 'components_about_key_stats';
  info: {
    description: "A stat card in the About page's Key Statistics & Compliance section";
    displayName: 'Key Stat';
  };
  attributes: {
    accent_color: Schema.Attribute.Enumeration<
      ['none', 'blue', 'gold', 'green']
    > &
      Schema.Attribute.DefaultTo<'none'>;
    description: Schema.Attribute.Text;
    source: Schema.Attribute.String;
    sub_stats: Schema.Attribute.Component<'about.sub-stat', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutSubStat extends Struct.ComponentSchema {
  collectionName: 'components_about_sub_stats';
  info: {
    description: 'A nested label/value line inside a key stat card';
    displayName: 'Sub Stat';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

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
      'about.challenge-stat': AboutChallengeStat;
      'about.key-stat': AboutKeyStat;
      'about.sub-stat': AboutSubStat;
      'about.timeline-item': AboutTimelineItem;
      'shared.bullet-point': SharedBulletPoint;
      'shared.seo': SharedSeo;
    }
  }
}
