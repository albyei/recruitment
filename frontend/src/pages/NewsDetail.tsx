import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, Share2, Facebook, Twitter, Linkedin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { newsArticles } from "@/lib/mockData";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const article = newsArticles.find((a) => a.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock gallery images for the article
  const galleryImages = [
    article?.image || "",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="container py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/news">Back to News</Link>
          </Button>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const relatedArticles = newsArticles
    .filter((a) => a.id !== id && a.category === article.category)
    .slice(0, 3);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = article.title;
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Article link copied to clipboard" });
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <article className="pt-24 pb-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row gap-8"
          >
            {/* Image Slider - Left Side */}
            <div className="lg:w-2/5">
              <div className="sticky top-24">
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
                  <img
                    src={galleryImages[currentImageIndex]}
                    alt={`${article.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  {/* Image Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </div>
                </div>

                {/* Thumbnail Navigation */}
                <div className="flex gap-2 mt-4">
                  {galleryImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-1 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-primary"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content - Right Side */}
            <div className="lg:w-3/5">
              <div className="bg-card rounded-xl border border-border p-8 md:p-10 shadow-card">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="mb-6 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-6">
                  <Badge variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {article.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(article.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  {article.title}
                </h1>

                {/* Content */}
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="lead text-lg">{article.excerpt}</p>
                  
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>

                  <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                    fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
                    culpa qui officia deserunt mollit anim id est laborum.
                  </p>

                  <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Key Highlights</h2>
                  
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Innovation and collaboration drive our success</li>
                    <li>Employee well-being is at the heart of everything we do</li>
                    <li>Continuous learning opportunities for career growth</li>
                    <li>Diverse and inclusive workplace culture</li>
                  </ul>

                  <p>
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                    doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                    veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                  </p>
                </div>

                <Separator className="my-8" />

                {/* Share */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <span className="text-sm font-medium text-foreground">Share this article</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleShare("facebook")}>
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleShare("twitter")}>
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleShare("linkedin")}>
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleShare("copy")}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-16 mt-12 bg-muted/30">
            <div className="container">
              <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    to={`/news/${related.id}`}
                    className="group bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <Badge variant="outline" className="text-xs mb-2">
                        {related.category}
                      </Badge>
                      <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      <PublicFooter />
    </div>
  );
}
