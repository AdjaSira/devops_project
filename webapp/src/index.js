const express = require('express');
const redis = require('redis');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Redis client configuration (optional - won't crash if Redis is unavailable)
let redisClient;
let redisAvailable = false;

(async () => {
  try {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retry_strategy: () => {
        return null; // Don't retry
      }
    });

    redisClient.on('error', (err) => {
      console.log('Redis Client Error (app will work without it):', err.message);
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
      redisAvailable = true;
    });

    await redisClient.connect();
  } catch (err) {
    console.log('Redis not available, continuing without it');
    redisAvailable = false;
  }
})();

// Routes

// Homepage - Display CV
app.get('/', async (req, res) => {
  let viewCount = 'N/A';
  
  // Increment view count if Redis is available
  if (redisAvailable && redisClient) {
    try {
      viewCount = await redisClient.incr('page_views');
    } catch (err) {
      console.log('Redis error:', err.message);
      viewCount = 'N/A';
    }
  }

  const cvData = {
    name: 'Sira Doumbouya',
    title: 'Cybersecurity Engineer',
    email: 'adjasirad@gmail.com',
    phone: '+33 7 46 51 83 97',
    summary: 'Passionate DevOps engineer with expertise in CI/CD, containerization, and cloud infrastructure.',
    experience: [
      {
        position: 'Senior DevOps Engineer',
        company: 'Tech Corp',
        period: '2021 - Present',
        description: 'Leading infrastructure automation and CI/CD pipeline implementation.'
      },
      {
        position: 'DevOps Engineer',
        company: 'StartUp Inc',
        period: '2019 - 2021',
        description: 'Managed AWS infrastructure and implemented Docker/Kubernetes deployments.'
      }
    ],
    education: [
      {
        degree: 'Master in Computer Science',
        school: 'ECE Paris',
        year: '2019'
      }
    ],
    skills: ['Docker', 'Kubernetes', 'Jenkins', 'Ansible', 'AWS', 'Linux', 'Python', 'Node.js']
  };

  res.render('index', { cv: cvData, viewCount });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: redisAvailable ? 'connected' : 'disconnected'
  };

  res.status(200).json(health);
});

// API endpoint to get view count
app.get('/api/views', async (req, res) => {
  if (!redisAvailable || !redisClient) {
    return res.status(503).json({ error: 'Redis not available' });
  }

  try {
    const views = await redisClient.get('page_views');
    res.json({ views: parseInt(views) || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    if (redisClient) {
      await redisClient.quit();
    }
    process.exit(0);
  });
});

module.exports = app;