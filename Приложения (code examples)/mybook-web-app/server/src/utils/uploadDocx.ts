import multer from 'multer';

export const uploadDocx = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isDocx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || file.originalname.toLowerCase().endsWith('.docx');

    if (isDocx) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  },
}).single('file');
