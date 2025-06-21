/**
 * Sample payment service code for testing purposes
 */
export class PaymentService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async processPayment(amount: number, currency: string): Promise<boolean> {
    try {
      // Simulate payment processing
      await this.delay(100);
      
      if (amount <= 0) {
        throw new Error("Invalid payment amount");
      }
      
      return true;
    } catch (error) {
      console.error("Payment processing failed:", error);
      return false;
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}