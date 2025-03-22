"use client";

import { useState } from "react";

import dbClient, { SidebarBlogs } from "@/lib/system/localdb/client";

export default function BlogManager() {
  const [title, setTitle] = useState("");
  const blogs = SidebarBlogs() || [];

  const handleAddBlog = async () => {
    await dbClient.createBlog({
      title,
    });

    setTitle(""); // Reset input field
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter blog title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={handleAddBlog}>Add Blog</button>

      <h3>Blogs:</h3>
      <ul>
        {blogs.map((blog) => (
          <li key={blog.blog_id}>
            {blog.title}{" "}
            <button onClick={() => dbClient.deleteBlog(blog.blog_id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
