const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to fetch data with retries
async function fetchDataWithRetry(url, options, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed: ${error.message}`);
      retries++;
    }
  }
  throw new Error(`Max retries reached. Unable to fetch data.`);
}

// Middleware to fetch blog data and perform analysis
app.get('/api/blog-stats', async (req, res) => {
  try {
    const url = 'https://intent-kit-16.hasura.app/api/rest/blogs';
    const options = {
      method: 'GET',
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    };

    const data = await fetchDataWithRetry(url, options);

    // Ensure that data is an object with a "blogs" property
    if (!data || !Array.isArray(data.blogs)) {
      throw new Error('Invalid data format received from the API.');
    }

    // Perform data analysis
    const totalBlogs = data.blogs.length;
    const longestBlog = data.blogs.reduce((prev, current) =>
      prev.title.length > current.title.length ? prev : current
    );
    const blogsWithPrivacy = data.blogs.filter((blog) =>
      blog.title.toLowerCase().includes('privacy')
    );
    const uniqueBlogTitles = Array.from(new Set(data.blogs.map((blog) => blog.title)));

    // Create a JSON response object with statistics
    const stats = {
      totalBlogs,
      longestBlog: longestBlog.title,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueBlogTitles,
    };

    // Send the response to the client
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// Implement Blog Search Endpoint
app.get('/api/blog-search', async (req, res) => {
  try {
    const query = req.query.query.toLowerCase();
    const url = 'https://intent-kit-16.hasura.app/api/rest/blogs';
    const options = {
      method: 'GET',
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    };

    const data = await fetchDataWithRetry(url, options);

    // Ensure that data is an object with a "blogs" property
    if (!data || !Array.isArray(data.blogs)) {
      throw new Error('Invalid data format received from the API.');
    }

    // Filter blogs based on the query
    const matchingBlogs = data.blogs.filter((blog) =>
      blog.title.toLowerCase().includes(query)
    );

    res.json(matchingBlogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
