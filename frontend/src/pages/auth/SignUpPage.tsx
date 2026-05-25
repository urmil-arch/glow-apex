import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Mail, RotateCcw, CheckCircle } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

interface RegisterForm {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

interface RegisterErrors {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

type Step = "register" | "verify";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpPage = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp } = useAuth();

  const [step, setStep] = useState<Step>("register");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [form, setForm] = useState<RegisterForm>({
    full_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({
    full_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validate = (): boolean => {
    const next: RegisterErrors = { full_name: "", username: "", email: "", password: "" };
    let ok = true;

    if (!form.full_name.trim()) {
      next.full_name = "Full name is required";
      ok = false;
    }
    if (!form.username.trim()) {
      next.username = "Username is required";
      ok = false;
    } else if (form.username.length < 3) {
      next.username = "Username must be at least 3 characters";
      ok = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      next.username = "Only letters, numbers, and underscores";
      ok = false;
    }
    if (!form.email.trim()) {
      next.email = "Email is required";
      ok = false;
    } else if (!EMAIL_REGEX.test(form.email)) {
      next.email = "Enter a valid email address";
      ok = false;
    }
    if (!form.password) {
      next.password = "Password is required";
      ok = false;
    } else if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters";
      ok = false;
    }

    setErrors(next);
    return ok;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError("");
    try {
      await register(form.full_name, form.username, form.email, form.password);
      setRegisteredEmail(form.email);
      setStep("verify");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.detail ?? "Registration failed. Please try again.");
      } else {
        setServerError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
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
      await verifyOtp(registeredEmail, otp);
      setIsVerified(true);
      setTimeout(() => navigate("/"), 1500);
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

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    setOtpError("");
    try {
      await resendOtp(registeredEmail);
      setResendMessage("A new OTP has been sent to your email.");
    } catch {
      setResendMessage("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900">Glow-Apex</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            {step === "register" ? "Create your account" : "Verify your email"}
          </h2>
          <p className="mt-2 text-gray-600">
            {step === "register"
              ? "Join us and boost your YouTube presence"
              : `We sent a 6-digit code to ${registeredEmail}`}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          {step === "register" ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.full_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.username ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password (min 6 characters)"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-5 w-5 mr-2" />
                  )}
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          ) : isVerified ? (
            <div className="text-center py-4">
              <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">Email Verified!</h3>
              <p className="text-gray-500 mt-2">Redirecting you to the dashboard…</p>
            </div>
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
                  className={`w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    otpError ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {otpError && <p className="mt-1 text-xs text-red-600">{otpError}</p>}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
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
                    setStep("register");
                    setOtp("");
                    setOtpError("");
                    setResendMessage("");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to registration
                </button>
              </div>
            </form>
          )}

          {step === "register" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/sign-in" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
