import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
// Modern Home Page Design - Commented out old components
// import HeroSection from '@/components/home/HeroSection'
// import FeaturedProducts from '@/components/home/FeaturedProducts'
// import CategoriesSection from '@/components/home/CategoriesSection'
// import DiscountProducts from '@/components/home/DiscountProducts'
// import BestSellingProducts from '@/components/home/BestSellingProducts'
// import WeekendDiscounts from '@/components/home/WeekendDiscounts'
// import TrendingProducts from '@/components/home/TrendingProducts'
// import BlogSection from '@/components/home/BlogSection'
// import FeaturesSection from '@/components/home/FeaturesSection'

// New Modern Home Page Components - Zenis Style
import ModernHeroSlider from '@/components/home/modern/ModernHeroSlider'
import FeatureBlocks from '@/components/home/modern/FeatureBlocks'
import FlashSellSection from '@/components/home/modern/FlashSellSection'
import BrowseByCategory from '@/components/home/modern/BrowseByCategory'
import FeaturedCategories from '@/components/home/modern/FeaturedCategories'
import SpecialBrandProducts from '@/components/home/modern/SpecialBrandProducts'
import TrendingProductsTabs from '@/components/home/modern/TrendingProductsTabs'
import BestSellingProducts from '@/components/home/modern/BestSellingProducts'
import NewArrivalProducts from '@/components/home/modern/NewArrivalProducts'
import FavoriteStyleProducts from '@/components/home/modern/FavoriteStyleProducts'
import TopBrandsSection from '@/components/home/modern/TopBrandsSection'
import NewsArticlesSection from '@/components/home/modern/NewsArticlesSection'
import NewsletterWithImage from '@/components/home/modern/NewsletterWithImage'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header />
      
      <main className="w-full">
        {/* Modern Zenis-Style Home Page - Exact Clone */}
        <ModernHeroSlider />
        <FeatureBlocks />
        <FlashSellSection />
        {/* <BrowseByCategory /> */}
        <FeaturedCategories />
        <SpecialBrandProducts />
        <TrendingProductsTabs />
        <BestSellingProducts />
        <NewArrivalProducts />
        <FavoriteStyleProducts />
        <TopBrandsSection />
        <NewsArticlesSection />
        <NewsletterWithImage />
        
        {/* Old Home Page Sections - Commented Out */}
        {/* <HeroSection /> */}
        {/* <FeaturesSection /> */}
        {/* <CategoriesSection /> */}
        {/* <FeaturedProducts /> */}
        {/* <DiscountProducts /> */}
        {/* <BestSellingProducts /> */}
        {/* <WeekendDiscounts /> */}
        {/* <TrendingProducts /> */}
        {/* <BlogSection /> */}
      </main>
      
      <Footer />
    </div>
  )
}
