import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

interface SocialLinks {
  social_twitter: string;
  social_instagram: string;
  social_youtube: string;
  social_facebook: string;
}

const Footer = () => {
  const [socials, setSocials] = useState<SocialLinks>({
    social_twitter: "",
    social_instagram: "",
    social_youtube: "",
    social_facebook: "",
  });

  useEffect(() => {
    api.get<SocialLinks>(API_ENDPOINTS.PUBLIC_SETTINGS)
      .then((res) => setSocials(res.data))
      .catch(() => {});
  }, []);

  const hasSocials =
    socials.social_twitter ||
    socials.social_instagram ||
    socials.social_youtube ||
    socials.social_facebook;

  return (
    <footer className="bg-black">
      <div className="container pt-[60px] pb-[50px]">
        <h1 className="mb-[30px] text-2xl font-bold text-background">
          <img src="/web-app-manifest-192x192-removebg-preview.png" alt="Logo" width={50} height={50} />
        </h1>
        <div className="w-full flex sm:flex-row flex-col justify-between sm:items-center items-start sm:gap-0 gap-10">
          <div className="w-full grid grid-cols-3">
            <ul className="text-muted-foreground  text-sm">
              <li className="font-semibold text-white  mb-2">Quick Link</li>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="">FAQs</Link>
              </li>
              <li>
                <Link to="/blogs">Blog</Link>
              </li>
            </ul>
            <ul className="text-muted-foreground  text-sm">
              <li className="mb-2 font-semibold text-white ">Services</li>
              <li>
                <Link to={"/buy-youtube-views"}>Buy Youtube Views</Link>
              </li>
              <li>
                <Link to={"/buy-youtube-video-likes"}>
                  Buy Youtube Likes
                </Link>
              </li>
              <li>
                <Link to={"/buy-youtube-subscribers"}>
                  Buy Youtube Subscribers
                </Link>
              </li>
              <li>
                <Link to={"/buy-youtube-comments"}>
                  Buy Youtube Comments
                </Link>
              </li>
              <li>
                <Link to={"/buy-youtube-shorts-views"}>
                  Buy Youtube Shorts Views
                </Link>
              </li>
              <li>
                <Link to={"/buy-youtube-shorts-likes"}>
                  Buy Youtube Shorts Likes
                </Link>
              </li>
            </ul>
            <ul className="text-muted-foreground  text-sm">
              <li className="mb-2 font-semibold text-white ">Policy</li>
              <li>
                <Link to={"/contact-us"}>Contact us</Link>
              </li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-white mb-2">Contact Information</p>
            <p>Tel: +91 72004 85444</p>
            <p>E-mail: support@glowapex.com</p>
            <p>Company: GlowApex</p>
          </div>
        </div>

        {hasSocials && (
          <div className="mt-8 flex items-center gap-4">
            {socials.social_twitter && (
              <a href={socials.social_twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.157zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {socials.social_instagram && (
              <a href={socials.social_instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </a>
            )}
            {socials.social_youtube && (
              <a href={socials.social_youtube} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.4 2.8 12 2.8 12 2.8s-4.4 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.2.7 11.5v2.1C.7 16 1 18 1 18s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.6 22.2 12 22.2 12 22.2s4.4 0 6.8-.2c.6-.1 1.9-.1 3-1.2.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.5v-2c0-2.3-.3-4.5-.3-4.5zm-13.8 9V8.5l8.1 3.7-8.1 3.8z" />
                </svg>
              </a>
            )}
            {socials.social_facebook && (
              <a href={socials.social_facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
      <hr />
      <div className="container py-5">
        <p className="text-muted-foreground text-sm text-center">
          © 2025 GlowApex. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
