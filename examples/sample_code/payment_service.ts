// Payment Service Implementation

export class PaymentService {
  private apiKey: string = "sk_live_1234"; // TODO: Move to environment variables
  
  async processPayment(amount: number, currency: string) {
    // FIXME: Add proper error handling for network failures
    try {
      // BUG: Currency validation is missing
      const result = await this.callPaymentAPI(amount, currency);
      
      // HACK: Temporary workaround for decimal precision
      const roundedAmount = Math.round(amount * 100) / 100;
      
      if (result.status === 'success') {
        // XXX: Should we log successful payments?
        return { success: true, transactionId: result.id };
      }
    } catch (error) {
      // TODO: Implement proper error logging
      console.error('Payment failed:', error);
      throw error;
    }
  }
  
  // DEPRECATED: Use processPayment instead
  async oldProcessPayment(amount: number) {
    // Legacy code - remove after migration
    return this.processPayment(amount, 'USD');
  }
  
  private async callPaymentAPI(amount: number, currency: string) {
    // FIXME: Add timeout and retry logic
    // BUG: API endpoint should be configurable
    const endpoint = 'https://api.payment.com/v1/charge';
    
    // TODO: Add request validation
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`, // HACK: Hardcoded auth
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, currency })
    });
    
    return response.json();
  }
}
