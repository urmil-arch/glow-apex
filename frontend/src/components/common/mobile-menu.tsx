import { Menu } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { menuitems } from "@/config/menu-items";

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLinkClick = (href: string) => {
    setIsOpen(false); // Close the mobile menu
    navigate(href); // Navigate to the link
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="xl:hidden flex" asChild>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl"
          variant={"outline"}
          size={"icon"}
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="p-7">
        <SheetTitle className="text-2xl font-bold uppercase">
          Glow Apex
        </SheetTitle>
        <ul className="grid gap-4 py-4">
          {menuitems.map((item) => {
            return item.items ? (
              <li key={item.id} className="">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="py-0">
                      <p className="text-lg font-semibold capitalize">
                        {item.title}
                      </p>
                    </AccordionTrigger>
                    <AccordionContent className="mt-4">
                      <ul className="list-disc text-base">
                        {item.items.map((child) => {
                          return (
                            <li className="capitalize" key={child.id}>
                              <button
                                onClick={() => handleLinkClick(child.href)}
                                className="text-left hover:text-emerald-600 transition-colors"
                              >
                                • {child.title}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </li>
            ) : (
              <li key={item.id} className="text-lg">
                <button
                  onClick={() => handleLinkClick(item.href)}
                  className="font-semibold capitalize text-left hover:text-emerald-600 transition-colors"
                >
                  {item.title}
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
};
