import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Instagram, Linkedin, Plane } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coluna 1: Logo, frase e ícones de redes sociais */}
          <div className="flex flex-col items-center md:items-start">
            <Plane />
            <p className="text-sm text-gray-400 mb-4">
              Uma breve frase sobre a empresa.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links "Demos" */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold mb-4">Demos</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Original
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Agency
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  SaaS
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Creative
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Links "Features" */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Overview
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Pages
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Components
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Newsletter */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-gray-400 mb-4">
              Inscreva-se para receber nossas atualizações.
            </p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="Email" className="bg-gray-800" />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              By signing up you agree to our{" "}
              <a
                href="/privacy-policy"
                className="text-blue-400 hover:text-blue-300"
              >
                privacy policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
