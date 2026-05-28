import React, { useState } from "react";
import {
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Check,
  ChevronRight,
  Headphones,
  ArrowRight,
  Loader2,
  Ticket,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";
import { useAuth } from "@/context/AuthContext";


const ContactPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"support" | "business" | "ticket">("support");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    type: "order_related" as "order_related" | "payment_related" | "other",
    subject: "",
    message: "",
    order_id: "",
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setSubmitError("");
  };

  const handleTicketSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTicketSubmitting(true);
    setTicketError("");
    try {
      await api.post(API_ENDPOINTS.TICKETS, ticketForm);
      setTicketSubmitted(true);
      setTicketForm({ type: "order_related", subject: "", message: "", order_id: "" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setTicketError(err.response?.data?.detail ?? "Failed to submit ticket.");
      } else {
        setTicketError("Failed to submit ticket.");
      }
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await api.post(API_ENDPOINTS.CONTACT_SEND, {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        type: activeTab,
      });
      setFormSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSubmitError(
          err.response?.data?.detail ?? "Failed to send your message. Please try again."
        );
      } else {
        setSubmitError("Failed to send your message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32 pt-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/90">
              Our team is here to help you succeed. Whether you have questions
              about our services or need support, we&apos;re just a message
              away.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-emerald-300 opacity-10 blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 -mt-10 relative z-20">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">Call Us</h3>
            <p className="text-gray-600 mb-4">
              We&apos;re available 24/7 for urgent inquiries
            </p>
            <Link
              to="tel:+18001234567"
              className="text-emerald-600 font-semibold hover:text-emerald-700"
            >
              +91 72004 85444
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">Email Us</h3>
            <p className="text-gray-600 mb-4">
              We respond to emails within 24 hours
            </p>
            <Link
              to="mailto:support@buyrealviews.com"
              className="text-emerald-600 font-semibold hover:text-emerald-700"
            >
              support@glowapex.com
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">
              Chat with our support team in real-time
            </p>
            <button className="text-emerald-600 font-semibold hover:text-emerald-700 flex items-center">
              Start Chat <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Contact Form and Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 bg-white">
              {/* Tab navigation */}
              <div className="flex mb-6 border-b flex-wrap">
                <button
                  className={`pb-3 px-4 text-lg font-medium ${
                    activeTab === "support"
                      ? "text-emerald-600 border-b-2 border-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("support")}
                >
                  Customer Support
                </button>
                <button
                  className={`pb-3 px-4 text-lg font-medium ${
                    activeTab === "business"
                      ? "text-emerald-600 border-b-2 border-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("business")}
                >
                  Business Inquiries
                </button>
                {user && (
                  <button
                    className={`pb-3 px-4 text-lg font-medium flex items-center gap-1.5 ${
                      activeTab === "ticket"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("ticket")}
                  >
                    <Ticket className="h-4 w-4" />
                    Submit Ticket
                  </button>
                )}
              </div>

              {/* Ticket form */}
              {activeTab === "ticket" && (
                ticketSubmitted ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Ticket Submitted!</h3>
                    <p className="text-gray-600 mb-4">
                      We&apos;ve received your ticket and will respond shortly.
                    </p>
                    <button
                      onClick={() => navigate("/dashboard/tickets")}
                      className="text-emerald-600 font-semibold hover:text-emerald-700 underline text-sm"
                    >
                      View your tickets in the dashboard
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={ticketForm.type}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, type: e.target.value as typeof ticketForm.type })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="order_related">Order Related</option>
                        <option value="payment_related">Payment Related</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {(ticketForm.type === "order_related" || ticketForm.type === "payment_related") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order ID <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={ticketForm.order_id}
                          onChange={(e) => setTicketForm({ ...ticketForm, order_id: e.target.value })}
                          placeholder="Paste your order ID"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="Brief summary of your issue"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        required
                        rows={5}
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                        placeholder="Describe your issue in detail"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    {ticketError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {ticketError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={ticketSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                      {ticketSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Ticket className="h-5 w-5" />
                          Submit Ticket
                        </>
                      )}
                    </button>
                  </form>
                )
              )}

              {/* Contact form */}
              {activeTab !== "ticket" && (formSubmitted ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-600">
                    We've received your message and will get back to you within 24 hours.
                    Check your inbox for a confirmation email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    ></textarea>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="consent"
                      className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      required
                    />
                    <label
                      htmlFor="consent"
                      className="ml-2 block text-sm text-gray-600"
                    >
                      I agree to the{" "}
                      <a
                        href="#"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        privacy policy
                      </a>{" "}
                      and consent to being contacted regarding my inquiry.
                    </label>
                  </div>

                  {submitError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              ))}
            </div>
          </div>

          {/* Info and Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Company Information</h3>

              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Our Office</p>
                    <p className="text-gray-600">
                      S9 Complex, Abu Highway
                      <br />
                      Palanpur, Gujarat 385001
                      <br />
                      India
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <Clock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Business Hours</p>
                    <p className="text-gray-600">
                      Monday - Saturday: 10:30 PM to 7:30 PM IST
                      <br />
                      Sunday: Closed (Email only)
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <Headphones className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Support Hours</p>
                    <p className="text-gray-600">
                      Our support team is available 24/7 for urgent issues.
                      Standard inquiries are processed during business hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            {/* <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="p-3 bg-emerald-100 rounded-full text-emerald-600 hover:bg-emerald-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="p-3 bg-emerald-100 rounded-full text-emerald-600 hover:bg-emerald-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="p-3 bg-emerald-100 rounded-full text-emerald-600 hover:bg-emerald-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="p-3 bg-emerald-100 rounded-full text-emerald-600 hover:bg-emerald-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="p-3 bg-emerald-100 rounded-full text-emerald-600 hover:bg-emerald-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div> */}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:mr-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to boost your YouTube presence?
              </h2>
              <p className="text-white/90 text-lg max-w-xl">
                Get started today and see the difference our real, high-quality
                views can make for your videos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/2342/buy-youtube-views"
                className="px-6 py-3 bg-white text-emerald-600 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Buy views now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/sign-in"
                className="px-6 py-3 bg-emerald-700 text-white font-medium rounded-lg hover:bg-emerald-800 transition-colors flex items-center justify-center"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
