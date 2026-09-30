// Main Application Component - Clean Google / Stripe White Aesthetic
window.App = function App() {
    const [activePayment, setActivePayment] = React.useState(null);
    const [rawPayload, setRawPayload] = React.useState(null);

    const handlePaymentCreated = (order) => {
        setActivePayment(order);
        setRawPayload(order);
    };

    const handlePaymentVerified = (order) => {
        setActivePayment(order);
        setRawPayload(order);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
            
            {/* Top Clean Navbar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-bold text-gray-900 tracking-tight">DirectUPI Switch</h1>
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                    Micro-Engine v1.0
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500">NPCI Compliant UPI Switch &bull; Concurrency Safe Double-Spend Guard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <div className="px-2.5 py-1 rounded-md bg-gray-100/80 border border-gray-200 flex items-center gap-1.5 text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Port 8080 Active</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 font-medium">
                            0% Fee Direct-to-Bank
                        </span>
                        <a
                            href="/h2-console"
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-md text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition font-medium"
                        >
                            H2 DB →
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
                
                {/* 3 Step Interactive Workflow Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <window.CreatePaymentCard onPaymentCreated={handlePaymentCreated} />
                    <window.QrCard activePayment={activePayment} />
                    <window.VerifyCard 
                        activeOrderId={activePayment ? activePayment.orderId : ''} 
                        onPaymentVerified={handlePaymentVerified} 
                    />
                </div>

                {/* Live Concurrency Proof */}
                <window.ConcurrencyRunner />

                {/* Raw JSON Inspector */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">REST Payload Inspector</span>
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Live JSON</span>
                        </div>
                        <button
                            onClick={() => setRawPayload(null)}
                            className="text-[11px] text-gray-400 hover:text-gray-600 transition"
                        >
                            Clear
                        </button>
                    </div>

                    <pre className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-gray-800 overflow-x-auto max-h-52">
                        {rawPayload ? JSON.stringify(rawPayload, null, 2) : '// Interact with any endpoint above to view real-time JSON responses...'}
                    </pre>
                </div>

            </main>

            {/* Clean Footer */}
            <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
                DirectUPI Switch &bull; Zero Intermediary Architecture &bull; Built with Spring Boot 3 &amp; React
            </footer>

        </div>
    );
};
