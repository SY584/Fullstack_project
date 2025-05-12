const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const Datastore = require('nedb');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


const users = new Datastore({ filename: 'users.db', autoload: true });
const notes = new Datastore({ filename: 'notes.db', autoload: true });


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    users.insert({ username, email, passwordHash }, (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.status(201).json({ message: 'User registered', userId: user._id });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    users.findOne({ username }, async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET);
      res.json({ token });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/notes', authMiddleware, (req, res) => {
  notes.find({ userId: req.userId, deleted: { $ne: true } }, (err, docs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch notes' });
    }
    res.json(docs);
  });
});


app.post('/api/notes', authMiddleware, (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const note = {
      userId: req.userId,
      title,
      content,
      createdAt: new Date(),
      deleted: false
    };
    notes.insert(note, (err, newNote) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create note' });
      }
      res.status(201).json(newNote);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/notes/:id', authMiddleware, (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    notes.update(
      { _id: req.params.id, userId: req.userId, deleted: { $ne: true } },
      { $set: { title, content, updatedAt: new Date() } },
      { returnUpdatedDocs: true },
      (err, numAffected, affectedDocuments) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update note' });
        }
        if (!numAffected) {
          return res.status(404).json({ error: 'Note not found' });
        }
        res.json(affectedDocuments);
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/notes/:id', authMiddleware, (req, res) => {
  notes.update(
    { _id: req.params.id, userId: req.userId },
    { $set: { deleted: true, deletedAt: new Date() } },
    {},
    (err, numAffected) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to move note to trash' });
      }
      if (!numAffected) {
        return res.status(404).json({ error: 'Note not found' });
      }
      res.json({ message: 'Note moved to trash' });
    }
  );
});

app.put('/api/notes/:id/restore', authMiddleware, (req, res) => {
  notes.update(
    { _id: req.params.id, userId: req.userId, deleted: true },
    { $set: { deleted: false }, $unset: { deletedAt: true } },
    {},
    (err, numAffected) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to restore note' });
      }
      if (!numAffected) {
        return res.status(404).json({ error: 'Note not found in trash' });
      }
      res.json({ message: 'Note restored' });
    }
  );
});

app.delete('/api/notes/:id/permanent', authMiddleware, (req, res) => {
  notes.remove({ _id: req.params.id, userId: req.userId, deleted: true }, {}, (err, numRemoved) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to permanently delete note' });
    }
    if (!numRemoved) {
      return res.status(404).json({ error: 'Note not found in trash' });
    }
    res.json({ message: 'Note permanently deleted' });
  });
});

app.get('/api/notes/:id', authMiddleware, (req, res) => {
  notes.findOne({ _id: req.params.id, userId: req.userId }, (err, note) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch note' });
    }
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  });
});

app.get('/api/user', authMiddleware, (req, res) => {
  users.findOne({ _id: req.userId }, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ username: user.username, email: user.email });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
