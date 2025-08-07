// 簡化版影片上傳系統 - 使用本地儲存
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// 中間件設定
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 本地儲存的影片資料
let videos = [];

// Multer 設定 - 本地儲存
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const studentDir = path.join(uploadDir, req.body.studentId);
        if (!fs.existsSync(studentDir)) {
            fs.mkdirSync(studentDir, { recursive: true });
        }
        cb(null, studentDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB 限制
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('只允許上傳影片檔案'));
        }
    }
});

// 影片上傳端點
app.post('/api/upload-video', upload.single('video'), async (req, res) => {
    try {
        const file = req.file;
        const studentId = req.body.studentId;
        const description = req.body.description;

        if (!file) {
            return res.status(400).json({ error: '沒有選擇檔案' });
        }

        if (!studentId || !description) {
            return res.status(400).json({ error: '缺少必要參數' });
        }

        console.log(`📤 開始上傳影片: ${file.originalname} (${file.size} bytes)`);

        // 建立影片記錄
        const videoRecord = {
            _id: Date.now().toString(),
            studentId,
            description,
            videoUrl: `/uploads/${studentId}/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            uploadDate: new Date(),
            status: 'pending',
            teacherFeedback: []
        };

        // 儲存到本地陣列
        videos.push(videoRecord);
        
        console.log(`✅ 影片上傳成功: ${videoRecord.videoUrl}`);
        res.json({ 
            success: true, 
            videoUrl: videoRecord.videoUrl,
            videoId: videoRecord._id
        });

    } catch (error) {
        console.error('❌ 影片上傳失敗:', error);
        res.status(500).json({ error: error.message });
    }
});

// 取得所有影片
app.get('/api/videos', async (req, res) => {
    try {
        res.json(videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 取得特定學生的影片
app.get('/api/videos/student/:studentId', async (req, res) => {
    try {
        const studentVideos = videos.filter(v => v.studentId === req.params.studentId);
        res.json(studentVideos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 老師審核影片
app.post('/api/videos/:videoId/review', async (req, res) => {
    try {
        const { status, comment, teacherId } = req.body;
        const videoIndex = videos.findIndex(v => v._id === req.params.videoId);

        if (videoIndex === -1) {
            return res.status(404).json({ error: '影片不存在' });
        }

        if (status === 'approved' || status === 'rejected') {
            videos[videoIndex].status = status;
            if (comment) {
                videos[videoIndex].teacherFeedback.push({
                    teacherId: teacherId || '老師',
                    comment: comment,
                    date: new Date()
                });
            }
            console.log(`✅ 影片審核完成: ${status}`);
            res.json({ success: true, video: videos[videoIndex] });
        } else {
            res.status(400).json({ error: '無效的狀態' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 刪除影片
app.delete('/api/videos/:videoId', async (req, res) => {
    try {
        const videoIndex = videos.findIndex(v => v._id === req.params.videoId);
        if (videoIndex === -1) {
            return res.status(404).json({ error: '影片不存在' });
        }

        const video = videos[videoIndex];
        
        // 刪除本地檔案
        const filePath = path.join(__dirname, video.videoUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 從陣列中移除
        videos.splice(videoIndex, 1);
        
        console.log(`🗑️ 影片刪除成功: ${video.fileName}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 健康檢查端點
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: 'development',
        version: '1.0.0-simple',
        videosCount: videos.length
    });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
    console.error('❌ 伺服器錯誤:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 簡化版伺服器運行在 port ${PORT}`);
    console.log(`🔗 健康檢查: http://localhost:${PORT}/api/health`);
    console.log(`📹 影片上傳: http://localhost:${PORT}/api/upload-video`);
    console.log(`📁 上傳目錄: ${uploadDir}`);
});

module.exports = app; 