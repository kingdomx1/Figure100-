"use client"

import Image from "next/image";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NextLogo from '../../../public/next.svg'
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Page from "../page";

export default function Home() {

    const { data: session } = useSession();
    if (!session) redirect("/login");
    console.log(session)

  return (
    <main>
      <Container>
          <Page/>
      </Container>
    </main>
    
  );
}
