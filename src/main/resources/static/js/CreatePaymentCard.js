// Google-style clean payment creation card
window.CreatePaymentCard = function CreatePaymentCard({ onPaymentCreated }) {
    const [amount, setAmount] = React.useState('1.00');
    const [merchantVpa, setMerchantVpa] = React.useState('mystore@icici');
    const [merchantName, setMerchantName] = React.useState('Apex Apparel Store');
    const [note, setNote] = React.useState('Test UPI Checkout');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await window.PaymentAPI.createPayment({
                amount,
                merchantVpa,
                merchantName,
                note
            });
            onPaymentCreated(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">1</span>
                        <h2 className="text-sm font-semibold text-gray-900">Create Payment Order</h2>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        POST /payments/create
                    </span>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount (INR) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-gray-400 font-medium text-sm">₹</span>
                            <input
                                type="number"
                                step="1.00"
                                min="1.00"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 pr-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Merchant UPI ID (VPA)</label>
                        <input
                            type="text"
                            value={merchantVpa}
                            onChange={(e) => setMerchantVpa(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm font-mono text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Merchant Name</label>
                        <input
                            type="text"
                            value={merchantName}
                            onChange={(e) => setMerchantName(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Note</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate Dynamic QR & Intent →'}
                    </button>
                </form>
            </div>
            <p className="text-[11px] text-gray-400 mt-4 text-center">Settles directly to bank with 0% gateway commission.</p>
        </div>
    );
};
