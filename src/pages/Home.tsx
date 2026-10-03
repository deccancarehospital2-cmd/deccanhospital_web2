import React from 'react';
import { Hero } from '../components/public/Hero';
import { InfoCards } from '../components/public/InfoCards';
import { Services } from '../components/public/Services';
import { About } from '../components/public/About';
import { Doctors } from '../components/public/Doctors';
import { Gallery } from '../components/public/Gallery';
import { EmergencyBanner } from '../components/public/EmergencyBanner';
import { Appointment } from '../components/public/Appointment';
import { Contact } from '../components/public/Contact';

export const Home: React.FC = () => {
  return (
    <main id="home">
      <Hero />
      <InfoCards />
      <Services />
      <About />
      <Doctors />
      <Gallery />
      <EmergencyBanner />
      <Appointment />
      <Contact />
    </main>
  );
};
