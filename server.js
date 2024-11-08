const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = 3001;
const JWT_SECRET = 'your-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
    // Skip auth for login
    if (req.path === '/v3/login') return next();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Dynamic JSON loader
async function loadJsonData(filePath) {
    try {
        const fullPath = path.join(__dirname, 'data', filePath);
        const data = await fs.readFile(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        return null;
    }
}

// Generic paginated response handler
function paginateResults(data, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = Array.isArray(data) ? data.slice(startIndex, endIndex) : [data];
    
    return {
        pagination: {
            total_results: Array.isArray(data) ? data.length : 1,
            total_pages: Math.ceil((Array.isArray(data) ? data.length : 1) / limit),
            current_page: parseInt(page)
        },
        resources: paginatedData
    };
}

// Auth routes
app.post('/v3/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Mock authentication
    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        const userData = await loadJsonData('user.json');
        res.json({
            token,
            user: userData || {
                guid: 'user-guid-123',
                name: 'Admin User',
                email: 'admin@example.com',
                avatar: null
            }
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Generic GET handler for all v3 routes
//app.get('/v3/*', authenticateToken, async (req, res) => {
app.get('/v3/*', async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pathParts = req.path.split('/');
        const resourceType = pathParts[2];
        const resourceId = pathParts[3];
        
        // Construct the JSON file path
        let jsonPath = `${resourceType}.json`;
        if (resourceId) {
            jsonPath = `${resourceType}/${resourceId}.json`;
        }

        const data = await loadJsonData(jsonPath);
        
        if (!data) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Return paginated response for collections, direct response for single resources
        if (resourceId) {
            res.json(data);
        } else {
            res.json(paginateResults(data, page, limit));
        }
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Generic POST handler for actions
app.post('/v3/:resource/:guid/actions/:action', authenticateToken, async (req, res) => {
    try {
        const { resource, guid, action } = req.params;
        const actionData = await loadJsonData(`${resource}/${guid}/actions/${action}.json`);
        
        if (!actionData) {
            // Fallback to the resource data if no specific action response exists
            const resourceData = await loadJsonData(`${resource}/${guid}.json`);
            if (!resourceData) {
                return res.status(404).json({ message: 'Resource not found' });
            }
            // Modify state based on action
            if (action === 'start') resourceData.state = 'STARTED';
            if (action === 'stop') resourceData.state = 'STOPPED';
            return res.json(resourceData);
        }
        
        res.json(actionData);
    } catch (error) {
        console.error('Error handling action:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

app.listen(port, () => {
    console.log(`Mock CF API server running at http://localhost:${port}`);
    console.log(`Data directory: ${path.join(__dirname, 'data')}`);
});