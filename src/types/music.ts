export interface Track {
  id: string;
  title: string;
  description?: string;
  audioUrl: string;
  mediaUrl?: string;
  mediaType?: 'video' | 'image' | null;
  tags: string[];
  platforms: {
    spotify?: string;
    deezer?: string;
    appleMusic?: string;
    youtube?: string;
  };
  userId: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
}