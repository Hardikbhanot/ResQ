import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [verifyMode, setVerifyMode] = useState(false); // If true, show verification code input
    const [resetMode, setResetMode] = useState(false); // If true, show password reset inputs (calc from flow)
    const [forgotMode, setForgotMode] = useState(false); // If true, show email input to request OTP
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'VIEWER', // Default
        code: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = isRegistering
            ? 'http://localhost:8080/auth/register'
            : verifyMode
                ? 'http://localhost:8080/auth/verify'
                : forgotMode
                    ? resetMode
                        ? 'http://localhost:8080/auth/reset-password'
                        : 'http://localhost:8080/auth/forgot-password'
                    : 'http://localhost:8080/auth/login';

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else if (data.message) {
                    alert(data.message);
                    if (isRegistering) {
                        setVerifyMode(true); // Go to verify
                        setIsRegistering(false); // clear register flag, keep verify flag
                    } else if (verifyMode) {
                        setVerifyMode(false); // Verified! Go to login
                    } else if (forgotMode) {
                        if (resetMode) {
                            // Password reset done!
                            setResetMode(false);
                            setForgotMode(false);
                            alert("Password changed! Please login.");
                        } else {
                            // OTP Sent
                            setResetMode(true);
                        }
                    }
                } else if (data.token) {
                    onLogin(data.token, data.role, formData.email);
                }
            })
            .catch(err => console.error(err));
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 w-100 px-3 position-relative overflow-hidden animate-fade-in">
            {/* Background Glow */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at center, rgba(250, 204, 21, 0.05) 0%, rgba(9, 9, 11, 0) 60%)',
                zIndex: 0,
                pointerEvents: 'none'
            }}></div>

            <div className="p-4 p-md-5 rounded-5 shadow-lg position-relative mx-auto" style={{ width: '100%', maxWidth: '420px', background: '#18181b', border: '1px solid #27272a', zIndex: 1 }}>
                <div className="text-center mb-4 mb-md-5">
                    <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px', background: 'var(--accent-yellow)', borderRadius: '50%', color: 'black', fontSize: '1.5rem' }}>
                        <i className="bi bi-shield-lock-fill"></i>
                    </div>
                    <h2 className="fw-bold mb-1 text-white fs-3">{verifyMode ? 'Verify Account' : isRegistering ? 'Create Account' : forgotMode ? (resetMode ? 'Reset Password' : 'Forgot Password') : 'Welcome Back'}</h2>
                    <p className="text-secondary small">
                        {verifyMode ? 'Enter the code sent to your email.' : isRegistering ? 'Join the ResQ network today.' : forgotMode ? (resetMode ? 'Enter code and new password.' : 'Enter email to receive code.') : 'Please sign in to continue.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label small text-uppercase fw-bold text-secondary">Email Address</label>
                        <div className="input-group">
                            <span className="input-group-text bg-dark border-secondary text-secondary"><i className="bi bi-envelope"></i></span>
                            <input
                                type="email"
                                name="email"
                                className="form-control bg-dark border-secondary text-light"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {!verifyMode && !forgotMode && (
                        <div className="mb-4">
                            <label className="form-label small text-uppercase fw-bold text-secondary">Password</label>
                            <div className="input-group">
                                <span className="input-group-text bg-dark border-secondary text-secondary"><i className="bi bi-key"></i></span>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-control bg-dark border-secondary text-light"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="text-end mt-1">
                                <button type="button" className="btn btn-link text-secondary p-0 small text-decoration-none" onClick={() => setForgotMode(true)}>Forgot Password?</button>
                            </div>
                        </div>
                    )}

                    {forgotMode && resetMode && (
                        <div className="mb-4">
                            <label className="form-label small text-uppercase fw-bold text-secondary">New Password</label>
                            <div className="input-group">
                                <span className="input-group-text bg-dark border-secondary text-secondary"><i className="bi bi-key"></i></span>
                                <input
                                    type="text"
                                    name="password"
                                    className="form-control bg-dark border-secondary text-light"
                                    placeholder="New Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {isRegistering && (
                        <div className="mb-4">
                            <label className="form-label small text-uppercase fw-bold text-secondary">Account Type</label>
                            <select
                                name="role"
                                className="form-select bg-dark border-secondary text-light"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="VIEWER">Viewer (Read Only)</option>
                                <option value="REPORTER">Reporter (Create Incidents)</option>
                            </select>
                        </div>
                    )}

                    {(verifyMode || (forgotMode && resetMode)) && (
                        <div className="mb-4">
                            <label className="form-label small text-uppercase fw-bold text-secondary">Verification Code</label>
                            <input
                                type="text"
                                name="code"
                                className="form-control bg-dark border-secondary text-light text-center fs-4 letter-spacing-2"
                                placeholder="••••••"
                                value={formData.code}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <button type="submit" className="btn-primary-brand w-100 mb-3">
                        {verifyMode ? 'Verify & Login' : isRegistering ? 'Sign Up' : forgotMode ? (resetMode ? 'Reset Password' : 'Send Code') : 'Sign In'}
                    </button>

                    {!verifyMode && !forgotMode && (
                        <div className="text-center">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-secondary"
                                onClick={() => setIsRegistering(!isRegistering)}
                            >
                                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            </button>
                        </div>
                    )}

                    {forgotMode && (
                        <div className="text-center">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none text-secondary"
                                onClick={() => { setForgotMode(false); setResetMode(false); }}
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
