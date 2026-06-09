import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, Clock, Share2, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author_name: string;
  read_time: string;
  image_url: string;
  date: string;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  image_url: string;
  date: string;
}

const BlogSlugPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    api.get<BlogPost>(`${API_ENDPOINTS.PUBLIC_BLOGS}/${slug}`)
      .then(res => {
        if (cancelled) return;
        setPost(res.data);
        // Related posts are non-critical — a failure here must not hide the post.
        api.get<RelatedPost[]>(`${API_ENDPOINTS.PUBLIC_BLOGS}/${slug}/related`)
          .then(relRes => { if (!cancelled) setRelated(relRes.data); })
          .catch(() => { if (!cancelled) setRelated([]); });
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

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

  if (loading) {
    return (
      <div className="container pt-44 pb-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (notFound || !post) {
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

  return (
    <div className="pt-32 pb-24">
      <div className="container max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link to="/blogs" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>

          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden mb-8 bg-emerald-50 flex items-center justify-center h-128">
            {post.image_url ? (
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-emerald-200 flex items-center justify-center text-emerald-700 text-4xl font-bold">
                {post.title.charAt(0)}
              </div>
            )}
          </div>

          {/* Header */}
          <div className="mb-8">
            <span className="bg-emerald-100 text-emerald-700 text-sm font-medium px-3 py-1 rounded-full">{post.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y py-4 mb-8">
            <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author_name}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{post.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.read_time}</span>
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
          {(post.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {(post.tags ?? []).map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* Related Posts */}
          {related.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map(rel => (
                  <Link key={rel.id} to={`/blogs/${rel.slug}`} className="group rounded-xl overflow-hidden border hover:shadow-md transition-shadow">
                    <div className="h-36 bg-emerald-50 flex items-center justify-center overflow-hidden">
                      {rel.image_url ? (
                        <img src={rel.image_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-200 flex items-center justify-center text-emerald-700 text-xl font-bold">
                          {rel.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-emerald-600 font-medium">{rel.category}</span>
                      <h3 className="font-semibold mt-1 group-hover:text-emerald-600 transition-colors line-clamp-2">{rel.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{rel.date}</p>
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
