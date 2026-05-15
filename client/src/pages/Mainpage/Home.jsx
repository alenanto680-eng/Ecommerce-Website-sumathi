import Hero from '../../components/homepage/Hero';
import About from '../../components/homepage/About';
import Category from '../../components/homepage/Category';
import NewArrivals from '../../components/homepage/NewArrivals';
import BestSelling from '../../components/homepage/BestSelling';
import WhyUs from '../../components/homepage/WhyUs';
import Reviews from '../../components/homepage/Reviews';

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Category />
      <NewArrivals />
      <BestSelling />
      <WhyUs />
      <Reviews />
    </main>
  );
}
