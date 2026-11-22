/**
 * Types de publication proposés par la « Nouvelle publication guidée » :
 * les 13 modèles de templates/index.js, rangés par catégorie avec une phrase d'aide.
 */
import { templates } from '../../templates/index.js';

export interface TemplateField {
  k: string;
  label: string;
  type: 'text' | 'textarea' | 'ar' | 'select' | 'photo';
  options?: Record<string, string>;
}
export interface TemplateDef {
  label: string;
  size: 'post' | 'tall';
  fields: TemplateField[];
  defaults: Record<string, string>;
}

export const TEMPLATES = templates as unknown as Record<string, TemplateDef>;

export { CATEGORIES, type PostType, type PostCategory } from './postCategories';
import { CATEGORIES } from './postCategories';

export const typeOf = (template: string) => CATEGORIES.flatMap((c) => c.types).find((t) => t.template === template);
