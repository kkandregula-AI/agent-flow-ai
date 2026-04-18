
export type RunMode = 'fast' | 'smart' | 'deep';

export type AttachmentMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type RunCreatePayload = {
  prompt: string;
  mode: RunMode;
  attachments?: AttachmentMeta[];
  sourceLinks?: string[];
  userId?: string;
};