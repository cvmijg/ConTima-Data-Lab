import { FileData } from '../types';

export const readFileAsText = (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Truncate if extremely large to avoid token limits, keeping header + first ~500 lines roughly
      // Average line ~100 chars -> 50,000 chars.
      const MAX_CHARS = 150000; 
      const truncatedContent = content.length > MAX_CHARS 
        ? content.substring(0, MAX_CHARS) + "\n...[TRUNCATED]" 
        : content;

      resolve({
        name: file.name,
        content: truncatedContent,
        size: file.size
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};