import { Request, Response } from 'express';
import { WalletService } from '../services/walletService';

export class WalletController {
  public static getWallet(req: Request, res: Response) {
    const userId = (req as any).user?.id || 'demo-user-id';
    const wallet = WalletService.getWallet(userId);
    return res.json({ success: true, data: wallet });
  }

  public static createOrder(req: Request, res: Response) {
    const { packageId } = req.body;
    const userId = (req as any).user?.id || 'demo-user-id';
    const order = WalletService.createRazorpayOrder(packageId, userId);
    return res.json({ success: true, data: order });
  }

  public static verifyPayment(req: Request, res: Response) {
    const { order_id, payment_id, signature, tokens } = req.body;
    const userId = (req as any).user?.id || 'demo-user-id';

    try {
      const result = WalletService.verifyPaymentAndCredit({
        order_id,
        payment_id,
        signature,
        tokens: parseInt(tokens, 10),
        userId
      });
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
