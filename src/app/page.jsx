"use client";

import Image from "next/image";
import Container from "./components/Container";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NextLogo from '../../public/next.svg'
import { useSession } from "next-auth/react";

export default function Home() {

  const { data: session } = useSession();

  return (
    <main>
      <Container>
        <Navbar session={session} />
          <div className="flex-grow text-center p-10">
            <div className="flex justify-center my-10">
              <Image src={NextLogo} width={300} height={100} alt="NextJS Logo" />
            </div>
          </div>
        <Footer />
      </Container>
    </main>
    
  );
}
