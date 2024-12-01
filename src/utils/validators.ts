export const validatePlatformUrl = (url: string, platform: string): boolean => {
  const patterns = {
    spotify: /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/,
    deezer: /^https:\/\/(www\.)?deezer\.com\/[a-z]{2}\/track\/[0-9]+/,
    appleMusic: /^https:\/\/music\.apple\.com\/[a-z]{2}\/album\/[^\/]+\/[0-9]+\?i=[0-9]+/,
    youtube: /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/
  };

  return patterns[platform as keyof typeof patterns]?.test(url) || false;
};