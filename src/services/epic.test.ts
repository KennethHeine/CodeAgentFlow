import { describe, it, expect } from 'vitest';
import { EpicService } from '../services/epic';

describe('EpicService', () => {
  describe('slugify', () => {
    it('should convert text to slug format', () => {
      const service = new EpicService({} as any, 'owner', 'repo');
      // Access private method through type assertion for testing
      const slugify = (service as any).slugify.bind(service);

      expect(slugify('My Epic Name')).toBe('my-epic-name');
      expect(slugify('Feature: User Auth')).toBe('feature-user-auth');
      expect(slugify('API v2.0')).toBe('api-v2-0');
      expect(slugify('  Extra  Spaces  ')).toBe('extra-spaces');
    });
  });

  describe('titleFromSlug', () => {
    it('should convert slug to title format', () => {
      const service = new EpicService({} as any, 'owner', 'repo');
      const titleFromSlug = (service as any).titleFromSlug.bind(service);

      expect(titleFromSlug('my-epic-name')).toBe('My Epic Name');
      expect(titleFromSlug('user-auth')).toBe('User Auth');
      expect(titleFromSlug('api-integration')).toBe('Api Integration');
    });
  });

  describe('parseEpicId', () => {
    it('should parse epic ID from folder name', () => {
      const service = new EpicService({} as any, 'owner', 'repo');
      const parseEpicId = (service as any).parseEpicId.bind(service);

      expect(parseEpicId('my-epic')).toBe('my-epic');
      expect(parseEpicId('feature-auth')).toBe('feature-auth');
    });
  });
});
