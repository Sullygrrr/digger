import React from 'react';
import { Music } from 'lucide-react';

interface PlatformLinksProps {
  platforms: Record<string, string>;
  onPlatformChange: (platform: string, url: string) => void;
}

export const PlatformLinks: React.FC<PlatformLinksProps> = ({
  platforms,
  onPlatformChange
}) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300">
        Liens des plateformes (optionnel)
      </label>
      {Object.entries(platforms).map(([platform, url]) => (
        <div key={platform}>
          <label className="block text-sm font-medium text-gray-400 mb-1 capitalize">
            {platform}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => onPlatformChange(platform, e.target.value)}
            placeholder={`Lien ${platform} 🎵`}
            className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
          />
        </div>
      ))}
    </div>
  );
};