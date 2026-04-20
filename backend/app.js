const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
// Tambahkan ini agar folder admin (frontend) bisa diakses
app.use(express.static(path.join(__dirname, 'admin')));


mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb:27017/cms_db');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// MODEL USER
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

// MODEL POST
const Post = mongoose.model('Post', { title: String, content: String, image: String });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/index.html'));
});

// --- LOGIKA REGISTER ---
app.post('/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password }); // Idealnya di-hash dengan bcrypt
        await newUser.save();
        res.status(201).json({ message: "User Created" });
    } catch (err) {
        res.status(400).json({ message: "Username sudah terdaftar" });
    }
});

// --- LOGIKA LOGIN ---
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    
    if (user) {
        // Kirim token (di sini kita pakai string dummy, idealnya pakai library 'jsonwebtoken')
        res.json({ token: "ini_token_akses_admin_123" });
    } else {
        res.status(401).json({ message: "Username atau Password salah" });
    }
});

app.post('/posts', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const newPost = new Post({
            title,
            content,
            image: req.file.filename // Nama file yang disimpan multer
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ message: "Gagal upload" });
    }
});

// Endpoint CRUD Artikel tetap sama...
app.get('/posts', async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

app.delete('/posts/:id', async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Terhapus" });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server jalan di port ${PORT}`);
});
