import React from 'react';
import Hero from '../../components/homepage/Hero';
import About from '../../components/homepage/About';
import Category from '../../components/homepage/Category';
import BestSelling from '../../components/homepage/BestSelling';
import NewArrivals from '../../components/homepage/NewArrivals';
import WhyUs from '../../components/homepage/WhyUs';
import Reviews from '../../components/homepage/Reviews';
import SEO from '../../components/SEO';

const HomePage = () => {
  return (
    <>
      <SEO 
        title="Best Kids Clothing in Kodigehalli & Bangalore"
        description="Shop the best kids clothing in Kodigehalli, Bangalore at Sumathi Trends. We offer a wide range of Occasion Wear, Party Wear, Traditional & Ethnic Wear, and Designer Frocks for kids."
        keywords="Best kids clothing in Kodigehalli, Best kids clothing in Bangalore, Sumathi Trends, Kids Boutique Bangalore, children's wear, party wear frocks, traditional ethnic wear"
        url="https://sumathitrends.com/"
      />
      <main>
        <Hero />
        <About />
        <Category />
        <BestSelling />
        <NewArrivals />
        <WhyUs />
        <Reviews />
      </main>
    </>
  );
};

export default HomePage;
