// Clean Google-style UTR Verification & Double-Spend Guard card
window.VerifyCard = function VerifyCard({ activeOrderId, onPaymentVerified }) {
    const [orderId, setOrderId] = React.useState('');
    const [utr, setUtr] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState(null);

    // Keep orderId in sync if a new order was created
    React.useEffect(() => {
        if (activeOrderId) {
            setOrderId(activeOrderId);
        }
    }, [activeOrderId]);

    const handleFillDemoUtr = () => {
        let randomUtr = "";
        for (let i = 0; i < 12; i++) {
            randomUtr += Math.floor(Math.random() * 10);
        }
        setUtr(randomUtr);
    };

    const handleVerify = async (customOrderId, customUtr) => {
        const targetOrder = customOrderId || orderId;
        const targetUtr = customUtr || utr;

        if (!targetOrder || !targetUtr) {
            setResult({
                success: false,
                status: 400,
                message: 'Please provide both an Order ID and a 12-digit UTR.'
            });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const { ok, status, data } = await window.PaymentAPI.verifyPayment(targetOrder, targetUtr);
            if (ok) {
                setResult({
                    success: true,
                    status: 200,
                    message: `Verified! Order ${data.orderId} marked as PAID with UTR ${data.utr}`
                });
                onPaymentVerified(data);
            } else {
                setResult({
                    success: false,
                    status: status,
                    message: data.message || (data.details ? JSON.stringify(data.details) : 'Verification failed')
                });
            }
        } catch (err) {
            setResult({
                success: false,
                status: 500,
                message: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDoubleSpendFraudTest = async () => {
        if (!utr) {
            alert('Please enter or verify a UTR first before testing double-spend!');
            return;
        }

        setLoading(true);
        try {
            // Create a second order
            const secondOrder = await window.PaymentAPI.createPayment({
                amount: 250.00,
                merchantVpa: 'victim@icici',
                merchantName: 'Victim Store',
                note: 'Victim Order for Double Spend Test'
            });

            // Attempt to reuse the exact same UTR
            setOrderId(secondOrder.orderId);
            await handleVerify(secondOrder.orderId, utr);
        } catch (err) {
            alert('Fraud test error: ' + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center">3</span>
                        <h2 className="text-sm font-semibold text-gray-900">Verify & Fraud Guard</h2>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        POST /verify
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Target Order ID</label>
                        <input
                            type="text"
                            placeholder="ORD_17277..."
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm font-mono text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-gray-700">12-Digit Bank UTR</label>
                            <button
                                type="button"
                                onClick={handleFillDemoUtr}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium transition"
                            >
                                🎲 Fill Demo Test UTR
                            </button>
                        </div>
                        <input
                            type="text"
                            maxLength={12}
                            placeholder="e.g. 428901827192"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm font-mono font-semibold tracking-wide text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        />
                        
                        <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200/80 rounded-lg text-[11px] text-gray-600 space-y-0.5">
                            <span className="font-semibold text-gray-700 block">📱 Where to find on your phone:</span>
                            <div>• <strong>PhonePe / Paytm:</strong> <em>UTR</em> or <em>UPI Ref No</em></div>
                            <div>• <strong>Google Pay:</strong> <em>UPI transaction ID</em> (12 digits)</div>
                        </div>
                    </div>

                    {result && (
                        <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                            result.success 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                            <div className="font-semibold flex items-center gap-1.5">
                                <span>{result.success ? '✅' : '❌'}</span>
                                <span>{result.success ? 'Payment Verified & Committed' : `Rejection (${result.status} Conflict)`}</span>
                            </div>
                            <div className="font-mono text-[11px] break-all">{result.message}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                <button
                    onClick={() => handleVerify()}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Claim & Verify UTR'}
                </button>

                <button
                    onClick={handleDoubleSpendFraudTest}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 hover:border-red-200 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                    <span>⚠️ Test Double-Spend Rejection (Fraud Guard)</span>
                </button>
            </div>
        </div>
    );
};
