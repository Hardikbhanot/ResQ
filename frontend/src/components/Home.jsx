import React from 'react';

const Home = ({ onStart }) => {
    return (
        <div className="d-flex flex-column min-vh-100 w-100 bg-main text-primary font-sans">
            {/* Hero Section */}
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-4 position-relative overflow-hidden">
                {/* Background Decor */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, rgba(9, 9, 11, 0) 70%)',
                    zIndex: 0
                }}></div>

                <div style={{ zIndex: 1 }}>
                    <div className="mb-4 d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', background: 'var(--accent-yellow)', borderRadius: '50%', color: 'black', fontSize: '2.5rem' }}>
                        <i className="bi bi-shield-fill-check"></i>
                    </div>

                    <h1 className="display-3 fw-bold mb-3" style={{ letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
                        ResQ Dispatch
                    </h1>

                    <p className="lead text-secondary mb-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        The next-generation emergency response coordination platform.
                        Real-time tracking, priority alerts, and instant communication.
                    </p>

                    <button
                        onClick={onStart}
                        className="btn-primary-brand btn-lg fs-5"
                    >
                        Launch Console <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <div className="container px-4 py-5">
                <div className="row g-4 py-5 row-cols-1 row-cols-lg-3 border-top border-secondary border-opacity-25">
                    <div className="col d-flex align-items-start text-start">
                        <div className="icon-square text-body-emphasis bg-body-secondary d-inline-flex align-items-center justify-content-center fs-4 flex-shrink-0 me-3">
                            <i className="bi bi-lightning-charge-fill text-warning"></i>
                        </div>
                        <div>
                            <h3 className="fs-5 text-white">Real-time Alerts</h3>
                            <p className="text-secondary small">Instant WebSocket-based incident reporting and propagation to all connected units.</p>
                        </div>
                    </div>
                    <div className="col d-flex align-items-start text-start">
                        <div className="icon-square text-body-emphasis bg-body-secondary d-inline-flex align-items-center justify-content-center fs-4 flex-shrink-0 me-3">
                            <i className="bi bi-shield-lock-fill text-success"></i>
                        </div>
                        <div>
                            <h3 className="fs-5 text-white">Secure Access</h3>
                            <p className="text-secondary small">Role-based access control for Admins, Reporters, and Viewers with email verification.</p>
                        </div>
                    </div>
                    <div className="col d-flex align-items-start text-start">
                        <div className="icon-square text-body-emphasis bg-body-secondary d-inline-flex align-items-center justify-content-center fs-4 flex-shrink-0 me-3">
                            <i className="bi bi-map-fill text-primary"></i>
                        </div>
                        <div>
                            <h3 className="fs-5 text-white">Geo-Tagging</h3>
                            <p className="text-secondary small">Automatic location detection and map integration for precise incident tracking.</p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="py-3 text-center text-secondary small border-top border-secondary border-opacity-10">
                &copy; 2025 ResQ Systems. All rights reserved.
            </footer>
        </div>
    );
};

export default Home;
