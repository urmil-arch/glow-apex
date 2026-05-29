import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, CheckCircle, Mail, RotateCcw } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

interface SignInForm {
  identifier: string;
  password: string;
}

type Step = "login" | "verify";

const SignInPage = () => {
  const navigate = useNavigate();
  const { login, verifyOtp, resendOtp } = useAuth();

  const [step, setStep] = useState<Step>("login");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const [form, setForm] = useState<SignInForm>({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignInForm>>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
  };

  const validate = (): boolean => {
    const next: Partial<SignInForm> = {};
    if (!form.identifier.trim()) next.identifier = "Email or username is required";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError("");
    try {
      const loggedInUser = await login(form.identifier.trim(), form.password);
      setIsSuccess(true);
      setTimeout(() => navigate(loggedInUser.is_admin ? "/admin" : "/"), 1000);
    } catch (err: unknown) {
      if ((err as { reason?: string })?.reason === "suspended") return;
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          const detail = err.response.data?.detail;
          const reason = typeof detail === "object" ? detail?.reason : null;
          const email = typeof detail === "object" ? detail?.email : null;
          if (reason === "suspended") {
            navigate("/suspended");
          } else if (email) {
            setUnverifiedEmail(email);
            setStep("verify");
          } else {
            const msg = typeof detail === "string" ? detail : "Sign in failed. Please try again.";
            setServerError(msg);
          }
        } else {
          setServerError(err.response?.data?.detail ?? "Invalid credentials. Please try again.");
        }
      } else {
        setServerError("Sign in failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!otp.trim()) {
      setOtpError("Please enter the OTP");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("OTP must be a 6-digit number");
      return;
    }

    setIsVerifying(true);
    setOtpError("");
    try {
      const verifiedUser = await verifyOtp(unverifiedEmail, otp);
      setIsSuccess(true);
      setTimeout(() => navigate(verifiedUser.is_admin ? "/admin" : "/"), 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setOtpError(err.response?.data?.detail ?? "Invalid OTP. Please try again.");
      } else {
        setOtpError("Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    setIsResending(true);
    setResendMessage("");
    setOtpError("");
    try {
      await resendOtp(unverifiedEmail);
      setResendMessage("A new OTP has been sent to your email.");
    } catch {
      setResendMessage("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <Link to="/">
                  <h1 className="text-2xl font-bold text-gray-900">GLOW APEX</h1>
                </Link>
                <h2 className="mt-4 text-2xl font-bold">
                  {step === "login" ? "Welcome Back" : "Verify your email"}
                </h2>
                <p className="text-gray-600 mt-2">
                  {step === "login"
                    ? "Sign in to continue to your dashboard"
                    : `We sent a 6-digit code to ${unverifiedEmail}`}
                </p>
              </div>

              {isSuccess ? (
                <div className="bg-emerald-50 p-6 rounded-xl text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800">
                    {step === "verify" ? "Email Verified!" : "Successfully Signed In!"}
                  </h3>
                  <p className="text-gray-600 mt-2">Redirecting you…</p>
                </div>
              ) : step === "login" ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {serverError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {serverError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                      Email or Username
                    </label>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      className={`w-full px-4 py-3 bg-gray-50 border ${
                        errors.identifier ? "border-red-500" : "border-gray-200"
                      } rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                      value={form.identifier}
                      onChange={handleChange}
                      placeholder="you@example.com or username"
                    />
                    {errors.identifier && (
                      <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className={`w-full px-4 py-3 bg-gray-50 border ${
                          errors.password ? "border-red-500" : "border-gray-200"
                        } rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-medium transition-all ${
                      isSubmitting ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Signing in…
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Sign in
                      </>
                    )}
                  </button>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Don&apos;t have an account?{" "}
                      <Link to="/sign-up" className="font-medium text-emerald-600 hover:text-emerald-500">
                        Sign up
                      </Link>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifySubmit} className="space-y-5">
                  <div className="flex justify-center mb-2">
                    <div className="bg-emerald-50 rounded-full p-4">
                      <Mail className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>

                  {resendMessage && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                      {resendMessage}
                    </div>
                  )}

                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ""));
                        setOtpError("");
                      }}
                      placeholder="Enter 6-digit code"
                      className={`w-full px-4 py-3 border rounded-xl text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        otpError ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {otpError && <p className="mt-1 text-xs text-red-600">{otpError}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
                  >
                    {isVerifying ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    {isVerifying ? "Verifying…" : "Verify Email"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {isResending ? "Sending…" : "Resend code"}
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("login");
                        setOtp("");
                        setOtpError("");
                        setResendMessage("");
                        setUnverifiedEmail("");
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Back to sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
