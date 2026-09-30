// Centralized API Client for DirectUPI Switch
window.PaymentAPI = {
    async createPayment({ amount, merchantVpa, merchantName, note }) {
        const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: parseFloat(amount),
                merchantVpa: merchantVpa ? merchantVpa.trim() : null,
                merchantName: merchantName ? merchantName.trim() : null,
                note: note ? note.trim() : null
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || (data.details ? JSON.stringify(data.details) : 'Failed to create payment'));
        }
        return data;
    },

    async verifyPayment(orderId, utr) {
        const response = await fetch(`/api/payments/${orderId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ utr: utr.trim() })
        });
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    },

    async getPayment(orderId) {
        const response = await fetch(`/api/payments/${orderId}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Payment not found');
        }
        return data;
    }
};
