function toVersionParts(version: string): number[] {
  const matches = version.match(/\d+/g);
  if (!matches) {
    return [0];
  }

  return matches.map((part) => Number.parseInt(part, 10)).filter((part) => Number.isFinite(part));
}

export function compareVersions(leftVersion: string, rightVersion: string): number {
  const leftParts = toVersionParts(leftVersion);
  const rightParts = toVersionParts(rightVersion);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = leftParts[index] ?? 0;
    const right = rightParts[index] ?? 0;

    if (left < right) {
      return -1;
    }
    if (left > right) {
      return 1;
    }
  }

  return 0;
}

export function isVersionLower(installedVersion: string, latestVersion: string): boolean {
  return compareVersions(installedVersion, latestVersion) < 0;
}
