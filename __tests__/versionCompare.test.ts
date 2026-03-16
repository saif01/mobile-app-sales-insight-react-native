import { compareVersions, isVersionLower } from '@/utils/versionCompare';

describe('versionCompare', () => {
  it('compares semantic-ish versions correctly', () => {
    expect(compareVersions('1.0.7', '1.0.7')).toBe(0);
    expect(compareVersions('1.0.7', '1.0.8')).toBe(-1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });

  it('detects when the installed version is lower', () => {
    expect(isVersionLower('1.0.7', '1.0.8')).toBe(true);
    expect(isVersionLower('1.2.0', '1.1.9')).toBe(false);
  });
});
