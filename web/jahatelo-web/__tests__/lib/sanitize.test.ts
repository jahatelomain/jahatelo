import { sanitizeText, sanitizeHtml, escapeHtml } from '@/lib/sanitize';

describe('Sanitize Utils', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(input);
      expect(result).toBe('Hello');
    });

    it('should remove script tags', () => {
      const input = '<script>malicious code</script>';
      const result = sanitizeText(input);
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should remove all HTML tags including safe ones', () => {
      const input = '<b>Bold</b> <i>Italic</i>';
      const result = sanitizeText(input);
      expect(result).toBe('Bold Italic');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe tags', () => {
      const input = '<b>Bold</b> and <i>italic</i>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });

    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
    });

    it('should remove dangerous attributes', () => {
      const input = '<a onclick="malicious()">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should keep allowed tags only', () => {
      const input = '<b>Bold</b> <strong>Strong</strong> <em>Emphasis</em> <p>Paragraph</p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('<p>');
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      const input = 'A & B';
      const result = escapeHtml(input);
      expect(result).toBe('A &amp; B');
    });

    it('should escape less than and greater than', () => {
      const input = '<script>';
      const result = escapeHtml(input);
      expect(result).toBe('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const input = '"quoted" and \'single\'';
      const result = escapeHtml(input);
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('should escape forward slash', () => {
      const input = '</script>';
      const result = escapeHtml(input);
      expect(result).toBe('&lt;&#x2F;script&gt;');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });
});
