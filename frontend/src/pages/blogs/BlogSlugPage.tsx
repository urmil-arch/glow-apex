import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { blogPosts, type BlogPost } from "@/config/data";
import { motion } from "framer-motion";
import { Calendar, User, Clock, Share2, ArrowLeft } from "lucide-react";

const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find((post) => post.slug === slug) as BlogPost | undefined;
};

const getRelatedPosts = (currentPost: BlogPost, allPosts: BlogPost[], limit = 3): BlogPost[] => {
  let related = allPosts.filter((p) => p.id !== currentPost.id && p.category === currentPost.category) as BlogPost[];
  if (related.length < limit) {
    const currentTags = currentPost.tags.map((t) => t.toLowerCase());
    const tagMatches = (allPosts as BlogPost[]).filter((p) => {
      if (p.id === currentPost.id || related.some((r) => r.id === p.id)) return false;
      return p.tags.some((t) => currentTags.includes(t.toLowerCase()));
    });
    related = [...related, ...tagMatches];
  }
  if (related.length < limit) {
    const rest = (allPosts as BlogPost[]).filter((p) => p.id !== currentPost.id && !related.some((r) => r.id === p.id));
    related = [...related, ...rest];
  }
  return related.slice(0, limit);
};

const BlogSlugPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    return (
      <div className="container pt-44 pb-24 text-center">
        <p className="text-lg text-gray-600">No blog post specified.</p>
        <button onClick={() => navigate("/blogs")} className="mt-4 text-emerald-600 hover:underline">
          Back to Blogs
        </button>
      </div>
    );
  }

  const post = getBlogPostBySlug(slug);

  if (!post) {
    return (
      <div className="container pt-44 pb-24 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
        <Link to="/blogs" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>
      </div>
    );
  }

  const relatedPosts = getRelatedPosts(post, blogPosts as BlogPost[]);

  return (
    <div className="pt-32 pb-24">
      <div className="container max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link to="/blogs" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>

          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <span className="bg-emerald-100 text-emerald-700 text-sm font-medium px-3 py-1 rounded-full">{post.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y py-4 mb-8">
            <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author.name}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{post.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.readTime}</span>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center gap-1 ml-auto hover:text-emerald-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />Share
            </button>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            {post.content.split("\n").map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(3)}</h2>;
              if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(4)}</h3>;
              if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
              return <p key={i} className="mb-4 text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((related) => (
                  <Link key={related.id} to={`/blogs/${related.slug}`} className="group rounded-xl overflow-hidden border hover:shadow-md transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img src={related.imageUrl} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-emerald-600 font-medium">{related.category}</span>
                      <h3 className="font-semibold mt-1 group-hover:text-emerald-600 transition-colors line-clamp-2">{related.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{related.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BlogSlugPage;
