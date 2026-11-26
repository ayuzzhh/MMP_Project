import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DocumentService } from '../services/documentService';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `doc-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, uniqueName);
  }
});

export const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|png|jpeg|jpg/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, and JPEG documents are allowed.'));
    }
  }
});

export class DocumentController {
  public static async getAllDocuments(req: Request, res: Response) {
    const { propertyId } = req.query;
    if (propertyId) {
      const docs = await DocumentService.getDocumentsForProperty(propertyId as string);
      return res.json({ success: true, count: docs.length, data: docs });
    }
    const all = await DocumentService.getAllDocuments();
    return res.json({ success: true, count: all.length, data: all });
  }

  public static async getDocumentById(req: Request, res: Response) {
    const { id } = req.params;
    const all = await DocumentService.getAllDocuments();
    const doc = all.find(d => d.id === id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    return res.json({ success: true, data: doc });
  }

  public static async uploadDocument(req: Request, res: Response) {
    const { property_id, document_type, title, raw_text_hint } = req.body;
    const user = req.user;

    if (!property_id || !document_type) {
      return res.status(400).json({ success: false, error: 'property_id and document_type are required' });
    }

    try {
      const fileName = req.file ? req.file.filename : `simulated_${Date.now()}.pdf`;
      const fileSize = req.file ? req.file.size : 256000;
      const mimeType = req.file ? req.file.mimetype : 'application/pdf';

      const doc = await DocumentService.addDocument({
        propertyId: property_id,
        docType: document_type,
        title: title || `${document_type.replace('_', ' ')} Upload`,
        fileName,
        fileSize,
        mimeType,
        user,
        rawTextHint: raw_text_hint
      });

      return res.status(201).json({
        success: true,
        message: 'Document uploaded and OCR extraction completed successfully.',
        data: doc
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async verifyOcrFields(req: Request, res: Response) {
    const { id } = req.params;
    const { verified_fields, submit_for_commit } = req.body;
    const user = req.user;

    try {
      const result = await DocumentService.verifyOcrFields({
        documentId: id,
        verifiedFields: verified_fields || {},
        user,
        submitForCommit: !!submit_for_commit
      });

      return res.json({
        success: true,
        message: submit_for_commit
          ? 'OCR fields human-verified and submitted to Super Admin Two-Man Rule queue for commit.'
          : 'OCR fields human-verified successfully.',
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async commitDocument(req: Request, res: Response) {
    const { id } = req.params;
    const user = req.user;

    try {
      const doc = await DocumentService.commitDocumentToRecords(id, user);
      return res.json({
        success: true,
        message: `Document ${id} intelligence committed directly into live cadastre records by Super Admin.`,
        data: doc
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
