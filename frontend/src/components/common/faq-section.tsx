import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SectionHeader from "./section-header";
import { Headset } from "lucide-react";
import { Link } from "react-router-dom";

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  faqs: FAQItem[];
  backgroundColor?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({
  title = "Frequently Asked Questions",
  subtitle = "FAQs",
  faqs,
  backgroundColor = "#0eca6d",
}) => {
  return (
    <section className="container pb-32">
      <SectionHeader title={title} tabHeading={subtitle} />

      <div className="mt-10 max-w-4xl mx-auto">
        <Accordion
          type="single"
          collapsible
          defaultValue={faqs.length > 0 ? faqs[0].id : undefined}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={String(index)}
              className="overflow-hidden rounded-2xl border border-[#0eca6d]/20 shadow-lg"
            >
              <div
                className="bg-gradient-to-r from-[#0eca6d] to-[#0eca6d]/90"
                style={{
                  backgroundColor:
                    backgroundColor === "#0eca6d" ? undefined : backgroundColor,
                }}
              >
                <AccordionTrigger className="sm:py-6 sm:px-8 py-4 px-4 text-white text-xl font-medium hover:no-underline !items-center [&>svg]:text-white cursor-pointer group">
                  <div className="flex items-center w-full">
                    <span className="mr-4 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white text-sm">
                      Q
                    </span>
                    <span className="text-left group-hover:text-white/90 transition-colors sm:text-base text-sm">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
              </div>

              <AccordionContent className="bg-white text-gray-700 sm:py-6 sm:px-8 py-4 px-4 pt-4 pb-6 text-base leading-relaxed border-t-0">
                <div className="flex">
                  <span className="mr-4 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#0eca6d]/10 text-[#0eca6d] text-sm mt-1">
                    A
                  </span>
                  <div className="prose prose-sm max-w-none sm:text-base text-sm">
                    {faq.answer}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Search and Support Section */}
        <div className="mt-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 text-center shadow-lg border border-gray-200 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-green-300 blur-3xl -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-blue-300 blur-3xl -ml-16 -mb-16"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-6">
              <Headset />
            </div>

            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Couldn&apos;t find what you need?
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              If the FAQ section didn&apos;t answer your question, we have
              additional resources to help you solve your problem quickly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link
                to="/contact-us"
                className="group block p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-[#0eca6d]/30"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#0eca6d]/10 rounded-xl flex items-center justify-center text-[#0eca6d] group-hover:bg-[#0eca6d] group-hover:text-white transition-colors duration-300">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      ></path>
                    </svg>
                  </div>
                  <div className="ml-4 text-left">
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">
                      Contact Support
                    </h4>
                    <p className="text-gray-500 text-sm">
                      Get personalized help from our experts
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                to="/blogs"
                className="group block p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-[#0eca6d]/30"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#0eca6d]/10 rounded-xl flex items-center justify-center text-[#0eca6d] group-hover:bg-[#0eca6d] group-hover:text-white transition-colors duration-300">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      ></path>
                    </svg>
                  </div>
                  <div className="ml-4 text-left">
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">
                      Knowledge Base
                    </h4>
                    <p className="text-gray-500 text-sm">
                      Browse detailed guides and articles
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <Link
              to="#"
              className="group mt-4 max-w-2xl mx-auto block p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-[#0eca6d]/30"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-[#0eca6d]/10 rounded-xl flex items-center justify-center text-[#0eca6d] group-hover:bg-[#0eca6d] group-hover:text-white transition-colors duration-300">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <h4 className="text-lg font-semibold text-gray-800 mb-1">
                    Video Tutorials
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Watch step-by-step solution guides
                  </p>
                </div>
              </div>
            </Link>
            <Link to="#">
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-4">
                <span className="text-gray-500 text-sm">
                  Need immediate assistance?
                </span>
                <button className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#0eca6d] text-white font-medium text-sm transition-all hover:shadow-lg hover:bg-[#0eca6d]/90">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  Live Support 24x7
                </button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
