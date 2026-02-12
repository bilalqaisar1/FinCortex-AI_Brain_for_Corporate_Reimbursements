import Navbar from "@/components/layout/navbar";
import HomePage from "./home/page";
import FeaturesPage from "./features/page";
import WorksPage from "./works/page";
import SolutionsPage from "./solutions/page";
import AboutPage from "./about/page";
import ReviewPage from "./review/page";
import ContactPage from "./contact/page";
import { EnhancedSeparator } from "@/components/ui/separator-enhanced";

export default function MainPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HomePage />
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-0" />
      <FeaturesPage />
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-0" />
      <WorksPage />
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-0" />
      <SolutionsPage />
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-0" />
      <AboutPage />
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-0" />
      <ReviewPage />
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-0" />
      <ContactPage />
    </div>
  );
}
