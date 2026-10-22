import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to current dir

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  maxUploadSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10), // 50MB
  batchProcessingLimit: parseInt(process.env.BATCH_LIMIT || '25', 10),
  uploadsDir: path.resolve(__dirname, '../../uploads'),
  dbPath: path.resolve(__dirname, '../../data/quenoxa.db'),
  tesseractEnabled: process.env.TESSERACT_ENABLED !== 'false',
};
