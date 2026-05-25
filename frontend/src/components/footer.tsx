import { Link } from "react-router-dom";
import React from "react";

const Footer = () => {
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
                <Link to={"/2342/buy-youtube-views"}>Buy Youtube Views</Link>
              </li>
              <li>
                <Link to={"/5648/buy-youtube-video-likes"}>
                  Buy Youtube Likes
                </Link>
              </li>
              <li>
                <Link to={"/5648/buy-youtube-subscribers"}>
                  Buy Youtube Subscribers
                </Link>
              </li>
              <li>
                <Link to={"/376/buy-youtube-comments"}>
                  Buy Youtube Comments
                </Link>
              </li>
              <li>
                <Link to={"/2342/buy-youtube-shorts-views"}>
                  Buy Youtube Shorts Views
                </Link>
              </li>
              <li>
                <Link to={"/2342/buy-youtube-shorts-likes"}>
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
