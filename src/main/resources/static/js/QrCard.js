// Clean Google-style QR & UPI Intent display card
window.QrCard = function QrCard({ activePayment }) {
    const qrRef = React.useRef(null);

    React.useEffect(() => {
        if (activePayment && qrRef.current) {
            qrRef.current.innerHTML = '';
            new QRCode(qrRef.current, {
                text: activePayment.upiIntentUri,
                width: 150,
                height: 150,
                colorDark: "#111827",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    }, [activePayment]);

    if (!activePayment) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                        <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center">2</span>
                            <h2 className="text-sm font-semibold text-gray-900">Dynamic QR & Intent</h2>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            AWAITING ORDER
                        </span>
                    </div>

                    <div className="py-20 text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xl text-gray-400">
                            📱
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Create an order in Step 1 to generate the QR code.</p>
                    </div>
                </div>
                <p className="text-[11px] text-gray-400 text-center">Supports GPay, PhonePe, Paytm & BHIM.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center">2</span>
                        <h2 className="text-sm font-semibold text-gray-900">Dynamic QR & Intent</h2>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                        activePayment.status === 'PAID' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {activePayment.status}
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Order Reference</span>
                            <span className="text-xs font-mono font-semibold text-gray-800 select-all">{activePayment.orderId}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-medium">Amount</span>
                            <span className="text-base font-bold text-gray-900">₹{activePayment.amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl shadow-inner mx-auto w-fit">
                        <div ref={qrRef} className="p-1 bg-white"></div>
                        <span className="text-[11px] text-gray-500 mt-2 font-medium">Scan with any UPI App</span>
                    </div>

                    <a
                        href={activePayment.upiIntentUri}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition shadow-sm"
                    >
                        ⚡ Open in Mobile UPI App
                    </a>

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                        <span className="font-semibold text-blue-900 block">📲 After paying on your phone:</span>
                        <p className="text-[11px] text-blue-800">
                            Look at your receipt for the <strong className="text-blue-950 font-semibold">12-digit UTR / UPI Ref ID</strong>, enter it in <strong>Step 3 &rarr;</strong> to confirm!
                        </p>
                    </div>
                </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-4 text-center">NPCI Standard Intent Specification v2.0</p>
        </div>
    );
};
